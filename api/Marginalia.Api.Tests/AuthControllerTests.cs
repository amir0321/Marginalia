using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Marginalia.Api.Configuration;
using Marginalia.Api.Controllers;
using Marginalia.Api.Data;
using Marginalia.Api.Dtos;
using Marginalia.Api.Extensions;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

namespace Marginalia.Api.Tests;

public sealed class AuthControllerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtSettings _jwtSettings;
    private readonly TokenService _tokenService;
    private readonly IServiceProvider _serviceProvider;

    public AuthControllerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new AppDbContext(dbOptions);
        _db.Database.EnsureCreated();

        _passwordHasher = new PasswordHasher<User>();

        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "this_is_a_very_secure_test_key_with_at_least_32_characters" },
            { "Jwt:Issuer", "Marginalia.Api.TestIssuer" },
            { "Jwt:Audience", "Marginalia.Web.TestAudience" },
            { "Jwt:ExpiresMinutes", "60" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _jwtSettings = ApiConfiguration.GetValidatedJwtSettings(configuration);
        _tokenService = new TokenService(_jwtSettings);

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

    private AuthController CreateController(AppDbContext? customDb = null)
    {
        var controller = new AuthController(customDb ?? _db, _passwordHasher, _tokenService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = _serviceProvider
                }
            }
        };

        return controller;
    }

    [Fact]
    public async Task Register_ValidData_Returns201_AndPersistsUserWithTrimmedUsernameNormalizedAndHashedPassword()
    {
        var controller = CreateController();
        var request = new RegisterRequest("  bokmalen  ", "starktLosenord123");

        var result = await controller.Register(request, CancellationToken.None);

        var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(StatusCodes.Status201Created, statusCodeResult.StatusCode);

        var savedUser = await _db.Users.SingleAsync();
        Assert.Equal("bokmalen", savedUser.Username);
        Assert.Equal("BOKMALEN", savedUser.UsernameNormalized);
        Assert.Equal(DateTimeKind.Utc, savedUser.CreatedAt.Kind);
        Assert.NotEqual("starktLosenord123", savedUser.PasswordHash);

        var verifyResult = _passwordHasher.VerifyHashedPassword(savedUser, savedUser.PasswordHash, "starktLosenord123");
        Assert.Equal(PasswordVerificationResult.Success, verifyResult);
    }

    [Fact]
    public async Task Register_DuplicateUsername_ExactCaseAndCasingMismatch_Returns409ConflictProblemDetails()
    {
        var controller = CreateController();

        var initialRequest = new RegisterRequest("bokmalen", "starktLosenord123");
        var initialResult = await controller.Register(initialRequest, CancellationToken.None);
        Assert.IsType<StatusCodeResult>(initialResult);

        // Exact match duplicate
        var duplicateRequest = new RegisterRequest("bokmalen", "annatLosenord123");
        var duplicateResult = await controller.Register(duplicateRequest, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(duplicateResult);
        Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
        var problem = Assert.IsAssignableFrom<ProblemDetails>(objectResult.Value);
        Assert.Equal("Conflict", problem.Title);
        Assert.Equal("Användarnamnet är redan upptaget", problem.Detail);

        // Different casing and whitespace duplicate
        var casingRequest = new RegisterRequest("  BOKMALEN  ", "annatLosenord123");
        var casingResult = await controller.Register(casingRequest, CancellationToken.None);

        var casingObjectResult = Assert.IsType<ObjectResult>(casingResult);
        Assert.Equal(StatusCodes.Status409Conflict, casingObjectResult.StatusCode);
        var casingProblem = Assert.IsAssignableFrom<ProblemDetails>(casingObjectResult.Value);
        Assert.Equal("Användarnamnet är redan upptaget", casingProblem.Detail);
    }

    [Fact]
    public async Task Register_UniqueIndexCollisionOnSave_Returns409ConflictProblemDetails()
    {
        var throwingOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var throwingDb = new ThrowingUniqueIndexDbContext(throwingOptions);
        var controller = CreateController(throwingDb);

        var request = new RegisterRequest("nyanvandare", "starktLosenord123");
        var result = await controller.Register(request, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
        var problem = Assert.IsAssignableFrom<ProblemDetails>(objectResult.Value);
        Assert.Equal("Conflict", problem.Title);
        Assert.Equal("Användarnamnet är redan upptaget", problem.Detail);
    }

    [Theory]
    [InlineData("", "starktLosenord123", "Ange ett användarnamn")]
    [InlineData("   ", "starktLosenord123", "Ange ett användarnamn")]
    [InlineData("ab", "starktLosenord123", "Användarnamnet måste vara mellan 3 och 30 tecken")]
    [InlineData("anvandarnamn_som_ar_langre_an_trettio_tecken", "starktLosenord123", "Användarnamnet måste vara mellan 3 och 30 tecken")]
    [InlineData("ogiltigt namn", "starktLosenord123", "Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck")]
    [InlineData("anvandare@doman", "starktLosenord123", "Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck")]
    [InlineData("giltig_anvandare", "", "Ange ett lösenord")]
    [InlineData("giltig_anvandare", "1234567", "Använd minst 8 tecken")]
    public async Task Register_InvalidInput_Returns400ValidationProblemDetails_AndSavesNoUser(string username, string password, string expectedError)
    {
        var controller = CreateController();
        var request = new RegisterRequest(username, password);

        var result = await controller.Register(request, CancellationToken.None);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var problem = Assert.IsAssignableFrom<ValidationProblemDetails>(objectResult.Value);
        var allErrors = problem.Errors.Values.SelectMany(v => v).ToList();
        Assert.Contains(allErrors, error => error == expectedError);

        Assert.Empty(await _db.Users.ToListAsync());
    }

    [Fact]
    public async Task Login_ValidCredentialsWithWhitespaceAndCasing_Returns200_WithValidJwtAndUserInfo()
    {
        var controller = CreateController();

        var registerRequest = new RegisterRequest("BokMalen", "starktLosenord123");
        var registerResult = await controller.Register(registerRequest, CancellationToken.None);
        Assert.IsType<StatusCodeResult>(registerResult);

        var loginRequest = new LoginRequest("  bokmalen  ", "starktLosenord123");
        var loginResult = await controller.Login(loginRequest, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(loginResult);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);

        var response = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.Equal("BokMalen", response.Username);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal(DateTimeKind.Utc, response.ExpiresAt.Kind);
        Assert.True(response.ExpiresAt > DateTime.UtcNow);

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = _jwtSettings.CreateTokenValidationParameters();
        var principal = tokenHandler.ValidateToken(response.Token, validationParameters, out var validatedToken);

        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);

        var userId = principal.GetUserId();
        var savedUser = await _db.Users.SingleAsync(u => u.UsernameNormalized == "BOKMALEN");
        Assert.Equal(savedUser.Id, userId);
    }

    [Fact]
    public async Task Login_WrongPassword_AndUnknownUsername_ReturnIdentical401ProblemDetails()
    {
        var controller = CreateController();

        var registerRequest = new RegisterRequest("bokmalen", "starktLosenord123");
        await controller.Register(registerRequest, CancellationToken.None);

        var wrongPasswordResult = await controller.Login(
            new LoginRequest("bokmalen", "felaktigtLosenord"),
            CancellationToken.None
        );

        var unknownUserResult = await controller.Login(
            new LoginRequest("okand_anvandare", "starktLosenord123"),
            CancellationToken.None
        );

        var wrongPasswordObject = Assert.IsType<ObjectResult>(wrongPasswordResult);
        var unknownUserObject = Assert.IsType<ObjectResult>(unknownUserResult);

        Assert.Equal(StatusCodes.Status401Unauthorized, wrongPasswordObject.StatusCode);
        Assert.Equal(StatusCodes.Status401Unauthorized, unknownUserObject.StatusCode);

        var wrongPasswordProblem = Assert.IsAssignableFrom<ProblemDetails>(wrongPasswordObject.Value);
        var unknownUserProblem = Assert.IsAssignableFrom<ProblemDetails>(unknownUserObject.Value);

        Assert.Equal("Unauthorized", wrongPasswordProblem.Title);
        Assert.Equal("Unauthorized", unknownUserProblem.Title);
        Assert.Equal("Fel användarnamn eller lösenord", wrongPasswordProblem.Detail);
        Assert.Equal("Fel användarnamn eller lösenord", unknownUserProblem.Detail);
        Assert.Equal(wrongPasswordProblem.Status, unknownUserProblem.Status);
    }

    [Theory]
    [InlineData("", "starktLosenord123", "Ange ett användarnamn")]
    [InlineData("   ", "starktLosenord123", "Ange ett användarnamn")]
    [InlineData("bokmalen", "", "Ange ett lösenord")]
    [InlineData("bokmalen", "1234567", "Använd minst 8 tecken")]
    public async Task Login_InvalidInput_Returns400ValidationProblemDetails(string username, string password, string expectedError)
    {
        var controller = CreateController();
        var request = new LoginRequest(username, password);

        var result = await controller.Login(request, CancellationToken.None);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var problem = Assert.IsAssignableFrom<ValidationProblemDetails>(objectResult.Value);
        var allErrors = problem.Errors.Values.SelectMany(v => v).ToList();
        Assert.Contains(allErrors, error => error == expectedError);
    }

    private sealed class ThrowingUniqueIndexDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            throw new DbUpdateException("UNIQUE constraint failed: Users.UsernameNormalized");
        }
    }
}
