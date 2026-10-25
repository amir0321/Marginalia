using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marginalia.Api.Data;
using Marginalia.Api.Dtos;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

namespace Marginalia.Api.Controllers;

[ApiController]
[Route("api/auth")]
public partial class AuthController(
    AppDbContext db,
    IPasswordHasher<User> passwordHasher,
    TokenService tokenService) : ControllerBase
{
    private static readonly string DummyPasswordHash =
        new PasswordHasher<User>().HashPassword(new User(), "dummy-marginalia-password-hash");

    [GeneratedRegex(@"^[a-zA-Z0-9._-]+$")]
    private static partial Regex UsernameRegex();

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        ValidateRegisterRequest(request, out var trimmedUsername);
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var normalizedUsername = trimmedUsername.ToUpperInvariant();
        var exists = await db.Users
            .AsNoTracking()
            .AnyAsync(u => u.UsernameNormalized == normalizedUsername, cancellationToken);

        if (exists)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: "Användarnamnet är redan upptaget"
            );
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = trimmedUsername,
            UsernameNormalized = normalizedUsername,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: "Användarnamnet är redan upptaget"
            );
        }

        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        ValidateLoginRequest(request, out var trimmedUsername);
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var normalizedUsername = trimmedUsername.ToUpperInvariant();
        var user = await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.UsernameNormalized == normalizedUsername, cancellationToken);

        if (user is null)
        {
            var dummyUser = new User { Username = "dummy", UsernameNormalized = "DUMMY" };
            passwordHasher.VerifyHashedPassword(dummyUser, DummyPasswordHash, request.Password);

            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "Fel användarnamn eller lösenord"
            );
        }

        var verificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "Fel användarnamn eller lösenord"
            );
        }

        var response = tokenService.CreateAuthResponse(user);
        return Ok(response);
    }

    private void ValidateRegisterRequest(RegisterRequest? request, out string trimmedUsername)
    {
        if (request is null)
        {
            trimmedUsername = string.Empty;
            AddUniqueModelError(nameof(RegisterRequest.Username), "Ange ett användarnamn");
            AddUniqueModelError(nameof(RegisterRequest.Password), "Ange ett lösenord");
            return;
        }

        trimmedUsername = request.Username?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            AddUniqueModelError(nameof(RegisterRequest.Username), "Ange ett användarnamn");
        }
        else
        {
            if (trimmedUsername.Length is < 3 or > 30)
            {
                AddUniqueModelError(nameof(RegisterRequest.Username), "Användarnamnet måste vara mellan 3 och 30 tecken");
            }

            if (!UsernameRegex().IsMatch(trimmedUsername))
            {
                AddUniqueModelError(nameof(RegisterRequest.Username), "Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck");
            }
        }

        if (string.IsNullOrEmpty(request.Password))
        {
            AddUniqueModelError(nameof(RegisterRequest.Password), "Ange ett lösenord");
        }
        else if (request.Password.Length < 8)
        {
            AddUniqueModelError(nameof(RegisterRequest.Password), "Använd minst 8 tecken");
        }
    }

    private void ValidateLoginRequest(LoginRequest? request, out string trimmedUsername)
    {
        if (request is null)
        {
            trimmedUsername = string.Empty;
            AddUniqueModelError(nameof(LoginRequest.Username), "Ange ett användarnamn");
            AddUniqueModelError(nameof(LoginRequest.Password), "Ange ett lösenord");
            return;
        }

        trimmedUsername = request.Username?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            AddUniqueModelError(nameof(LoginRequest.Username), "Ange ett användarnamn");
        }

        if (string.IsNullOrEmpty(request.Password))
        {
            AddUniqueModelError(nameof(LoginRequest.Password), "Ange ett lösenord");
        }
        else if (request.Password.Length < 8)
        {
            AddUniqueModelError(nameof(LoginRequest.Password), "Använd minst 8 tecken");
        }
    }

    private void AddUniqueModelError(string key, string errorMessage)
    {
        if (ModelState.TryGetValue(key, out var entry))
        {
            if (entry.Errors.Any(e => e.ErrorMessage == errorMessage))
            {
                return;
            }
        }

        ModelState.AddModelError(key, errorMessage);
    }
}
