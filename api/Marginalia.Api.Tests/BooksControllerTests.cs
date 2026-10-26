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

public sealed class BooksControllerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly IServiceProvider _serviceProvider;

    public BooksControllerTests()
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

    private BooksController CreateController(Guid userId) => new(_db)
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

    private async Task<Book> SeedBookAsync(
        Guid userId,
        string title = "Testbok",
        string author = "Författare",
        DateOnly? date = null,
        string? desc = null,
        Guid? id = null)
    {
        var book = new Book
        {
            Id = id ?? Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Author = author,
            PublishedDate = date ?? new DateOnly(2020, 1, 1),
            Description = desc
        };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        return book;
    }

    private static void AssertNotFound(IActionResult result)
    {
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, obj.StatusCode);
        var problem = Assert.IsAssignableFrom<ProblemDetails>(obj.Value);
        Assert.Equal("Not Found", problem.Title);
        Assert.Equal("Boken hittades inte", problem.Detail);
    }

    private static void AssertValidationError(IActionResult result, string expectedError)
    {
        var obj = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, obj.StatusCode);
        var problem = Assert.IsAssignableFrom<ValidationProblemDetails>(obj.Value);
        Assert.Contains(problem.Errors.Values.SelectMany(v => v), e => e == expectedError);
    }

    [Fact]
    public async Task GetAll_ReturnsUserBooksSortedByTitleAscendingThenById()
    {
        var u1 = await SeedUserAsync("u1");
        var u2 = await SeedUserAsync("u2");
        var id1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var id2 = Guid.Parse("00000000-0000-0000-0000-000000000002");

        await SeedBookAsync(u1.Id, "C-bok", "Författare C");
        await SeedBookAsync(u1.Id, "A-bok", "Författare A");
        await SeedBookAsync(u1.Id, "B-bok", "Författare B2", id: id2);
        await SeedBookAsync(u1.Id, "B-bok", "Författare B1", id: id1);
        await SeedBookAsync(u2.Id, "A-bok från annan", "Annan");

        var result = await CreateController(u1.Id).GetAll(CancellationToken.None);
        var books = Assert.IsAssignableFrom<IEnumerable<BookResponse>>(Assert.IsType<OkObjectResult>(result).Value).ToList();

        Assert.Equal(4, books.Count);
        Assert.Equal(["A-bok", "B-bok", "B-bok", "C-bok"], books.Select(b => b.Title));
        Assert.Equal(id1, books[1].Id);
        Assert.Equal(id2, books[2].Id);
        Assert.DoesNotContain(books, b => b.Author == "Annan");
    }

    [Fact]
    public async Task GetAll_WhenEmpty_Returns200OkEmptyList()
    {
        var u = await SeedUserAsync("empty");
        var result = await CreateController(u.Id).GetAll(CancellationToken.None);
        var books = Assert.IsAssignableFrom<IEnumerable<BookResponse>>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Empty(books);
    }

    [Fact]
    public async Task GetById_OwnedBook_Returns200OkWithResponse()
    {
        var u = await SeedUserAsync("u");
        var date = new DateOnly(1929, 9, 24);
        var book = await SeedBookAsync(u.Id, "Ett eget rum", "Virginia Woolf", date, "Klassiker");

        var result = await CreateController(u.Id).GetById(book.Id, CancellationToken.None);
        var res = Assert.IsType<BookResponse>(Assert.IsType<OkObjectResult>(result).Value);

        Assert.Equal(book.Id, res.Id);
        Assert.Equal("Ett eget rum", res.Title);
        Assert.Equal("Virginia Woolf", res.Author);
        Assert.Equal(date, res.PublishedDate);
        Assert.Equal("Klassiker", res.Description);
    }

    [Fact]
    public async Task GetById_ForeignOrNonExistentBook_Returns404NotFound()
    {
        var u1 = await SeedUserAsync("u1");
        var u2 = await SeedUserAsync("u2");
        var foreignBook = await SeedBookAsync(u2.Id);

        var controller = CreateController(u1.Id);
        AssertNotFound(await controller.GetById(foreignBook.Id, CancellationToken.None));
        AssertNotFound(await controller.GetById(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task Create_ValidBook_TrimsFieldsAndReturns201WithLocation()
    {
        var u = await SeedUserAsync("creator");
        var date = new DateOnly(1940, 10, 1);
        var req = new BookRequest("  Kallocain  ", "  Karin Boye  ", date, "  Dystopi  ");

        var result = await CreateController(u.Id).Create(req, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(result);

        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.Equal(nameof(BooksController.GetById), created.ActionName);
        var res = Assert.IsType<BookResponse>(created.Value);
        Assert.Equal(res.Id, created.RouteValues?["id"]);
        Assert.Equal("Kallocain", res.Title);
        Assert.Equal("Karin Boye", res.Author);
        Assert.Equal("Dystopi", res.Description);

        var saved = await _db.Books.SingleAsync(b => b.Id == res.Id);
        Assert.Equal(u.Id, saved.UserId);
        Assert.Equal("Kallocain", saved.Title);
        Assert.Equal("Karin Boye", saved.Author);
        Assert.Equal("Dystopi", saved.Description);
    }

    [Theory]
    [InlineData("   ")]
    [InlineData("")]
    [InlineData(null)]
    public async Task Create_BlankDescription_NormalizesToNull(string? desc)
    {
        var u = await SeedUserAsync("desc_u_" + Guid.NewGuid().ToString("N")[..4]);
        var req = new BookRequest("Titel", "Författare", new DateOnly(2020, 1, 1), desc);

        var result = await CreateController(u.Id).Create(req, CancellationToken.None);
        var res = Assert.IsType<BookResponse>(Assert.IsType<CreatedAtActionResult>(result).Value);

        Assert.Null(res.Description);
        var saved = await _db.Books.SingleAsync(b => b.Id == res.Id);
        Assert.Null(saved.Description);
    }

    [Theory]
    [InlineData("", "Virginia Woolf", "1929-09-24", "Ange bokens titel")]
    [InlineData("   ", "Virginia Woolf", "1929-09-24", "Ange bokens titel")]
    [InlineData("Ett eget rum", "", "1929-09-24", "Ange bokens författare")]
    [InlineData("Ett eget rum", "   ", "1929-09-24", "Ange bokens författare")]
    [InlineData("Ett eget rum", "Virginia Woolf", null, "Välj ett publiceringsdatum")]
    [InlineData("Ett eget rum", "Virginia Woolf", "0001-01-01", "Välj ett publiceringsdatum")]
    public async Task Create_InvalidFields_Returns400ValidationProblemDetails(string t, string a, string? d, string err)
    {
        var u = await SeedUserAsync("err_u_" + Guid.NewGuid().ToString("N")[..4]);
        DateOnly? date = d != null ? DateOnly.Parse(d) : null;
        var result = await CreateController(u.Id).Create(new BookRequest(t, a, date), CancellationToken.None);

        AssertValidationError(result, err);
        Assert.Empty(await _db.Books.Where(b => b.UserId == u.Id).ToListAsync());
    }

    [Fact]
    public async Task Create_NullRequestAndMaxLengthViolations_Return400()
    {
        var u = await SeedUserAsync("max_u");
        var controller = CreateController(u.Id);

        var nullResult = await controller.Create(null!, CancellationToken.None);
        AssertValidationError(nullResult, "Ange bokens titel");

        var longReq = new BookRequest(new string('a', 201), new string('b', 201), new DateOnly(2020, 1, 1), new string('c', 501));
        var maxResult = await controller.Create(longReq, CancellationToken.None);
        AssertValidationError(maxResult, "Titeln får vara högst 200 tecken");
        AssertValidationError(maxResult, "Författaren får vara högst 200 tecken");
        AssertValidationError(maxResult, "Beskrivningen får vara högst 500 tecken");
    }

    [Fact]
    public async Task Update_ValidBook_UpdatesFieldsAndTrims()
    {
        var u = await SeedUserAsync("updater");
        var originalCreated = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var book = new Book
        {
            Id = Guid.NewGuid(),
            UserId = u.Id,
            Title = "Gammal",
            Author = "Gammal",
            PublishedDate = new DateOnly(1930, 1, 1),
            CreatedAt = originalCreated
        };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var newDate = new DateOnly(1935, 5, 15);
        var req = new BookRequest("  Ny  ", "  NyF  ", newDate, "  NyB  ");
        var result = await CreateController(u.Id).Update(book.Id, req, CancellationToken.None);
        var res = Assert.IsType<BookResponse>(Assert.IsType<OkObjectResult>(result).Value);

        Assert.Equal("Ny", res.Title);
        Assert.Equal("NyF", res.Author);
        Assert.Equal(newDate, res.PublishedDate);
        Assert.Equal("NyB", res.Description);

        var updated = await _db.Books.SingleAsync(b => b.Id == book.Id);
        Assert.Equal("Ny", updated.Title);
        Assert.Equal(originalCreated, updated.CreatedAt);
        Assert.Equal(u.Id, updated.UserId);
    }

    [Fact]
    public async Task Update_BlankDescription_NormalizesToNull()
    {
        var u = await SeedUserAsync("upd_desc");
        var book = await SeedBookAsync(u.Id, desc: "Fanns");
        var req = new BookRequest(book.Title, book.Author, book.PublishedDate, "   ");

        var result = await CreateController(u.Id).Update(book.Id, req, CancellationToken.None);
        var res = Assert.IsType<BookResponse>(Assert.IsType<OkObjectResult>(result).Value);

        Assert.Null(res.Description);
        Assert.Null((await _db.Books.SingleAsync(b => b.Id == book.Id)).Description);
    }

    [Fact]
    public async Task Update_ForeignOrNonExistentBook_Returns404_AndLeavesDbUntouched()
    {
        var u1 = await SeedUserAsync("u1");
        var u2 = await SeedUserAsync("u2");
        var foreignBook = await SeedBookAsync(u2.Id, "Original", "Original");

        var controller = CreateController(u1.Id);
        var req = new BookRequest("Kapad", "Kapad", new DateOnly(2020, 1, 1));

        AssertNotFound(await controller.Update(foreignBook.Id, req, CancellationToken.None));
        AssertNotFound(await controller.Update(Guid.NewGuid(), req, CancellationToken.None));

        var dbBook = await _db.Books.SingleAsync(b => b.Id == foreignBook.Id);
        Assert.Equal("Original", dbBook.Title);
    }

    [Fact]
    public async Task Update_InvalidData_Returns400BeforeDbLookup()
    {
        var u = await SeedUserAsync("u_inv");
        var result = await CreateController(u.Id).Update(Guid.NewGuid(), new BookRequest("", "A", new DateOnly(2020, 1, 1)), CancellationToken.None);
        AssertValidationError(result, "Ange bokens titel");
    }

    [Fact]
    public async Task Delete_OwnedBook_RemovesFromDbAndReturns204()
    {
        var u = await SeedUserAsync("deleter");
        var book = await SeedBookAsync(u.Id);

        var result = await CreateController(u.Id).Delete(book.Id, CancellationToken.None);
        Assert.IsType<NoContentResult>(result);
        Assert.False(await _db.Books.AnyAsync(b => b.Id == book.Id));
    }

    [Fact]
    public async Task Delete_ForeignOrNonExistentBook_Returns404_AndLeavesDbUntouched()
    {
        var u1 = await SeedUserAsync("u1");
        var u2 = await SeedUserAsync("u2");
        var foreignBook = await SeedBookAsync(u2.Id);

        var controller = CreateController(u1.Id);
        AssertNotFound(await controller.Delete(foreignBook.Id, CancellationToken.None));
        AssertNotFound(await controller.Delete(Guid.NewGuid(), CancellationToken.None));

        Assert.True(await _db.Books.AnyAsync(b => b.Id == foreignBook.Id));
    }
}
