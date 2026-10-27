using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Marginalia.Api.Controllers;
using Marginalia.Api.Data;
using Marginalia.Api.Dtos;
using Marginalia.Api.Models;

namespace Marginalia.Api.Tests;

public sealed class QuotesControllerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly IServiceProvider _serviceProvider;

    public QuotesControllerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new AppDbContext(dbOptions);
        _db.Database.EnsureCreated();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddProblemDetails();
        services.AddControllers();
        _serviceProvider = services.BuildServiceProvider();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private QuotesController CreateController(Guid userId) => new(_db)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()), new Claim(ClaimTypes.Name, "testuser")],
                    "TestAuth")),
                RequestServices = _serviceProvider
            }
        }
    };

    private async Task<User> SeedUserAsync(string name)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = name,
            UsernameNormalized = name.ToUpperInvariant(),
            PasswordHash = "hash"
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    private async Task<Quote> SeedQuoteAsync(
        Guid userId,
        string text = "Ett fint citat",
        string author = "Författare",
        DateTime? createdAt = null,
        Guid? id = null)
    {
        var quote = new Quote
        {
            Id = id ?? Guid.NewGuid(),
            UserId = userId,
            Text = text,
            Author = author,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };
        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync();
        return quote;
    }

    private static void AssertNotFound(IActionResult result)
    {
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, obj.StatusCode);
        var problem = Assert.IsAssignableFrom<ProblemDetails>(obj.Value);
        Assert.Equal("Not Found", problem.Title);
        Assert.Equal("Citatet hittades inte", problem.Detail);
    }

    private static void AssertConflict(IActionResult result, string expectedDetail)
    {
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status409Conflict, obj.StatusCode);
        var problem = Assert.IsAssignableFrom<ProblemDetails>(obj.Value);
        Assert.Equal("Conflict", problem.Title);
        Assert.Equal(expectedDetail, problem.Detail);
    }

    private static void AssertValidationError(IActionResult result, string expectedError)
    {
        var obj = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, obj.StatusCode);
        var problem = Assert.IsAssignableFrom<ValidationProblemDetails>(obj.Value);
        Assert.Contains(problem.Errors.Values.SelectMany(v => v), e => e == expectedError);
    }

    [Fact]
    public async Task GetAll_ReturnsUserQuotesSortedOldestFirstThenById()
    {
        var u1 = await SeedUserAsync("u1");
        var u2 = await SeedUserAsync("u2");

        var baseTime = new DateTime(2025, 1, 1, 10, 0, 0, DateTimeKind.Utc);
        var id1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var id2 = Guid.Parse("00000000-0000-0000-0000-000000000002");

        await SeedQuoteAsync(u1.Id, "Tredje citatet", "Författare 3", createdAt: baseTime.AddHours(2));
        await SeedQuoteAsync(u1.Id, "Första citatet", "Författare 1", createdAt: baseTime);
        await SeedQuoteAsync(u1.Id, "Andra citatet B", "Författare 2B", createdAt: baseTime.AddHours(1), id: id2);
        await SeedQuoteAsync(u1.Id, "Andra citatet A", "Författare 2A", createdAt: baseTime.AddHours(1), id: id1);
        await SeedQuoteAsync(u2.Id, "Annan användares citat", "Annan författare", createdAt: baseTime.AddHours(-5));

        var result = await CreateController(u1.Id).GetAll(CancellationToken.None);
        var quotes = Assert.IsAssignableFrom<IEnumerable<QuoteResponse>>(Assert.IsType<OkObjectResult>(result).Value).ToList();

        Assert.Equal(4, quotes.Count);
        Assert.Equal("Första citatet", quotes[0].Text);
        Assert.Equal(id1, quotes[1].Id);
        Assert.Equal(id2, quotes[2].Id);
        Assert.Equal("Tredje citatet", quotes[3].Text);
        Assert.DoesNotContain(quotes, q => q.Author == "Annan författare");
    }

    [Fact]
    public async Task GetAll_WhenEmpty_Returns200OkEmptyList()
    {
        var u = await SeedUserAsync("empty");
        var result = await CreateController(u.Id).GetAll(CancellationToken.None);
        var quotes = Assert.IsAssignableFrom<IEnumerable<QuoteResponse>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Empty(quotes);
    }

    [Fact]
    public async Task Create_ValidQuote_TrimsFieldsAndReturns201()
    {
        var u = await SeedUserAsync("creator");
        var req = new QuoteRequest("  Visst gör det ont när knoppar brister  ", "  Karin Boye  ");

        var result = await CreateController(u.Id).Create(req, CancellationToken.None);
        var obj = Assert.IsType<ObjectResult>(result);

        Assert.Equal(StatusCodes.Status201Created, obj.StatusCode);
        var res = Assert.IsType<QuoteResponse>(obj.Value);
        Assert.Equal("Visst gör det ont när knoppar brister", res.Text);
        Assert.Equal("Karin Boye", res.Author);

        var saved = await _db.Quotes.SingleAsync(q => q.Id == res.Id);
        Assert.Equal(u.Id, saved.UserId);
        Assert.Equal("Visst gör det ont när knoppar brister", saved.Text);
        Assert.Equal("Karin Boye", saved.Author);
    }

    [Fact]
    public async Task Create_WhenUserAlreadyHas5Quotes_Returns409Conflict()
    {
        var u = await SeedUserAsync("maxquotes");
        for (var i = 1; i <= 5; i++)
        {
            await SeedQuoteAsync(u.Id, $"Citat {i}", $"Författare {i}");
        }

        var req = new QuoteRequest("Sjätte citatet", "Någon");
        var result = await CreateController(u.Id).Create(req, CancellationToken.None);

        AssertConflict(result, "Du har nått maxgränsen på fem citat.");

        var count = await _db.Quotes.CountAsync(q => q.UserId == u.Id);
        Assert.Equal(5, count);
    }

    [Fact]
    public async Task Create_WhenAnotherUserHas5Quotes_DoesNotBlockCurrentUser()
    {
        var u1 = await SeedUserAsync("user1");
        var u2 = await SeedUserAsync("user2");

        for (var i = 1; i <= 5; i++)
        {
            await SeedQuoteAsync(u2.Id, $"Annan citat {i}", $"Författare {i}");
        }

        var req = new QuoteRequest("Mitt första citat", "Min författare");
        var result = await CreateController(u1.Id).Create(req, CancellationToken.None);

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status201Created, obj.StatusCode);

        Assert.Equal(1, await _db.Quotes.CountAsync(q => q.UserId == u1.Id));
        Assert.Equal(5, await _db.Quotes.CountAsync(q => q.UserId == u2.Id));
    }

    [Fact]
    public async Task Create_AfterDeletingOneOf5Quotes_AllowsCreatingNewQuote()
    {
        var u = await SeedUserAsync("recycle");
        Quote? quoteToDelete = null;
        for (var i = 1; i <= 5; i++)
        {
            var q = await SeedQuoteAsync(u.Id, $"Citat {i}", $"Författare {i}");
            if (i == 3)
            {
                quoteToDelete = q;
            }
        }

        Assert.NotNull(quoteToDelete);

        var controller = CreateController(u.Id);

        var sixthAttempt = await controller.Create(new QuoteRequest("Sjätte", "Författare"), CancellationToken.None);
        AssertConflict(sixthAttempt, "Du har nått maxgränsen på fem citat.");

        var deleteResult = await controller.Delete(quoteToDelete.Id, CancellationToken.None);
        Assert.IsType<NoContentResult>(deleteResult);
        Assert.Equal(4, await _db.Quotes.CountAsync(q => q.UserId == u.Id));

        var createAfterDelete = await controller.Create(new QuoteRequest("Ersättningscitat", "Ny författare"), CancellationToken.None);
        var createdObj = Assert.IsType<ObjectResult>(createAfterDelete);
        Assert.Equal(StatusCodes.Status201Created, createdObj.StatusCode);
        Assert.Equal(5, await _db.Quotes.CountAsync(q => q.UserId == u.Id));
    }

    [Theory]
    [InlineData("", "Karin Boye", "Ange citatet")]
    [InlineData("   ", "Karin Boye", "Ange citatet")]
    [InlineData("Citat", "", "Ange citatets författare")]
    [InlineData("Citat", "   ", "Ange citatets författare")]
    public async Task Create_WithBlankFields_Returns400BadRequest(string text, string author, string expectedError)
    {
        var u = await SeedUserAsync("invalid_" + Guid.NewGuid().ToString("N")[..4]);
        var req = new QuoteRequest(text, author);

        var result = await CreateController(u.Id).Create(req, CancellationToken.None);
        AssertValidationError(result, expectedError);
    }

    [Fact]
    public async Task Create_WithExceedingLength_Returns400BadRequest()
    {
        var u = await SeedUserAsync("toolong");
        var controller = CreateController(u.Id);

        var longTextReq = new QuoteRequest(new string('a', 601), "Karin Boye");
        var textResult = await controller.Create(longTextReq, CancellationToken.None);
        AssertValidationError(textResult, "Citatet får vara högst 600 tecken");

        var longAuthorReq = new QuoteRequest("Giltigt citat", new string('b', 201));
        var authorResult = await controller.Create(longAuthorReq, CancellationToken.None);
        AssertValidationError(authorResult, "Författaren får vara högst 200 tecken");
    }

    [Fact]
    public async Task Create_WithNullRequest_Returns400BadRequest()
    {
        var u = await SeedUserAsync("null_req");
        var result = await CreateController(u.Id).Create(null!, CancellationToken.None);
        AssertValidationError(result, "Ange citatet");
        AssertValidationError(result, "Ange citatets författare");
    }

    [Fact]
    public async Task Update_OwnedQuote_TrimsFieldsAndReturns200Ok()
    {
        var u = await SeedUserAsync("updater");
        var original = await SeedQuoteAsync(u.Id, "Originaltext", "Originalförfattare");

        var req = new QuoteRequest("  Ny uppdaterad text  ", "  Ny författare  ");
        var result = await CreateController(u.Id).Update(original.Id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var res = Assert.IsType<QuoteResponse>(ok.Value);
        Assert.Equal(original.Id, res.Id);
        Assert.Equal("Ny uppdaterad text", res.Text);
        Assert.Equal("Ny författare", res.Author);

        var inDb = await _db.Quotes.SingleAsync(q => q.Id == original.Id);
        Assert.Equal("Ny uppdaterad text", inDb.Text);
        Assert.Equal("Ny författare", inDb.Author);
    }

    [Fact]
    public async Task Update_ForeignOrNonExistentQuote_Returns404NotFoundAndLeavesDbUntouched()
    {
        var u1 = await SeedUserAsync("u1_upd");
        var u2 = await SeedUserAsync("u2_upd");
        var foreignQuote = await SeedQuoteAsync(u2.Id, "Annan text", "Annan författare");

        var controller = CreateController(u1.Id);
        var req = new QuoteRequest("Hackat citat", "Hacker");

        AssertNotFound(await controller.Update(foreignQuote.Id, req, CancellationToken.None));
        AssertNotFound(await controller.Update(Guid.NewGuid(), req, CancellationToken.None));

        var untouched = await _db.Quotes.SingleAsync(q => q.Id == foreignQuote.Id);
        Assert.Equal("Annan text", untouched.Text);
        Assert.Equal("Annan författare", untouched.Author);
        Assert.Equal(u2.Id, untouched.UserId);
    }

    [Theory]
    [InlineData("", "Karin Boye", "Ange citatet")]
    [InlineData("   ", "Karin Boye", "Ange citatet")]
    [InlineData("Citat", "", "Ange citatets författare")]
    [InlineData("Citat", "   ", "Ange citatets författare")]
    public async Task Update_WithInvalidFields_Returns400BadRequest(string text, string author, string expectedError)
    {
        var u = await SeedUserAsync("inv_upd_" + Guid.NewGuid().ToString("N")[..4]);
        var quote = await SeedQuoteAsync(u.Id);

        var req = new QuoteRequest(text, author);
        var result = await CreateController(u.Id).Update(quote.Id, req, CancellationToken.None);
        AssertValidationError(result, expectedError);
    }

    [Fact]
    public async Task Delete_OwnedQuote_Returns204NoContentAndRemovesFromDb()
    {
        var u = await SeedUserAsync("deleter");
        var quote = await SeedQuoteAsync(u.Id, "Ska tas bort", "Någon");

        var result = await CreateController(u.Id).Delete(quote.Id, CancellationToken.None);
        Assert.IsType<NoContentResult>(result);

        var exists = await _db.Quotes.AnyAsync(q => q.Id == quote.Id);
        Assert.False(exists);
    }

    [Fact]
    public async Task Delete_ForeignOrNonExistentQuote_Returns404NotFoundAndLeavesDbUntouched()
    {
        var u1 = await SeedUserAsync("u1_del");
        var u2 = await SeedUserAsync("u2_del");
        var foreignQuote = await SeedQuoteAsync(u2.Id, "Rör ej", "Författare");

        var controller = CreateController(u1.Id);
        AssertNotFound(await controller.Delete(foreignQuote.Id, CancellationToken.None));
        AssertNotFound(await controller.Delete(Guid.NewGuid(), CancellationToken.None));

        var stillThere = await _db.Quotes.SingleOrDefaultAsync(q => q.Id == foreignQuote.Id);
        Assert.NotNull(stillThere);
        Assert.Equal(u2.Id, stillThere.UserId);
    }
}
