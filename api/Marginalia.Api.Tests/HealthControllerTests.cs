using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Marginalia.Api.Controllers;
using Marginalia.Api.Data;

namespace Marginalia.Api.Tests;

public class HealthControllerTests
{
    [Fact]
    public async Task Get_WhenDatabaseIsReachable_ReturnsOkResult_WithStatusOk()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var controller = new HealthController(db);

        var result = await controller.Get();

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Get_WhenDatabaseCannotConnect_Returns503ServiceUnavailable()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        await using var db = new DisconnectedDbContext(options);
        var controller = new HealthController(db);

        var result = await controller.Get();

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objectResult.StatusCode);
    }

    private sealed class DisconnectedDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
    {
        public override DatabaseFacade Database => new DisconnectedDatabaseFacade(this);
    }

    private sealed class DisconnectedDatabaseFacade(DbContext context) : DatabaseFacade(context)
    {
        public override Task<bool> CanConnectAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(false);
    }
}
