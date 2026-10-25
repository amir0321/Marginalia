using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Marginalia.Api.Configuration;
using Marginalia.Api.Controllers;
using Marginalia.Api.Extensions;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

namespace Marginalia.Api.Tests;

public class EndpointAuthorizationTests
{
    private static (ServiceProvider ServiceProvider, JwtSettings JwtSettings) CreateAuthServices(
        Action<JwtSettings>? customizeSettings = null)
    {
        var jwtSettings = new JwtSettings
        {
            Key = "a_very_secure_test_signing_key_32_chars_long!",
            Issuer = "marginalia-test",
            Audience = "marginalia-test-aud",
            ExpiresMinutes = 60,
        };
        customizeSettings?.Invoke(jwtSettings);

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddMarginaliaAuth(jwtSettings);
        services.AddSingleton(jwtSettings);
        services.AddScoped<TokenService>();

        return (services.BuildServiceProvider(), jwtSettings);
    }

    private static string CreateCustomToken(
        string key,
        string issuer,
        string audience,
        DateTime expires,
        Guid? userId = null,
        string? username = null)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, (userId ?? Guid.NewGuid()).ToString()),
            new(JwtRegisteredClaimNames.UniqueName, username ?? "testuser"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task AssertInvalidTokenIsRejectedAndReturns401(
        IServiceProvider sp,
        string token,
        Type? expectedExceptionType = null)
    {
        var authService = sp.GetRequiredService<IAuthenticationService>();
        var policyEvaluator = sp.GetRequiredService<IPolicyEvaluator>();
        var authOptions = sp.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var fallbackPolicy = authOptions.FallbackPolicy!;

        var context = new DefaultHttpContext { RequestServices = sp };
        context.Request.Headers.Authorization = $"Bearer {token}";

        var authenticateResult = await authService.AuthenticateAsync(context, JwtBearerDefaults.AuthenticationScheme);
        Assert.False(authenticateResult.Succeeded);
        Assert.NotNull(authenticateResult.Failure);

        if (expectedExceptionType != null)
        {
            Assert.IsAssignableFrom(expectedExceptionType, authenticateResult.Failure);
        }

        var authResult = await policyEvaluator.AuthenticateAsync(fallbackPolicy, context);
        Assert.False(authResult.Succeeded);

        var authorizeResult = await policyEvaluator.AuthorizeAsync(fallbackPolicy, authResult, context, resource: null);
        Assert.False(authorizeResult.Succeeded);
        Assert.True(authorizeResult.Challenged);

        await authService.ChallengeAsync(context, JwtBearerDefaults.AuthenticationScheme, properties: null);
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public void BooksController_And_QuotesController_HaveAuthorizeAttribute_AndNoAllowAnonymous()
    {
        var protectedControllers = new[] { typeof(BooksController), typeof(QuotesController) };

        foreach (var controller in protectedControllers)
        {
            var classAuthorize = controller.GetCustomAttribute<AuthorizeAttribute>(inherit: true);
            Assert.NotNull(classAuthorize);

            var classAllowAnonymous = controller.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true);
            Assert.Null(classAllowAnonymous);

            var methods = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
            foreach (var method in methods)
            {
                var methodAllowAnonymous = method.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true);
                Assert.Null(methodAllowAnonymous);
            }
        }
    }

    [Fact]
    public void OnlyAllowedEndpoints_HaveAllowAnonymousAttribute()
    {
        var apiAssembly = typeof(Program).Assembly;
        var controllerTypes = apiAssembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
            .ToList();

        var anonymousEndpoints = new List<string>();

        foreach (var controller in controllerTypes)
        {
            var controllerHasAllowAnonymous = controller.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null;

            var actions = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Where(m => !m.IsSpecialName);

            foreach (var action in actions)
            {
                var actionHasAllowAnonymous = action.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null;
                if (controllerHasAllowAnonymous || actionHasAllowAnonymous)
                {
                    anonymousEndpoints.Add($"{controller.Name}.{action.Name}");
                }
            }
        }

        var expectedAnonymousEndpoints = new HashSet<string>
        {
            $"{nameof(HealthController)}.{nameof(HealthController.Get)}",
            $"{nameof(AuthController)}.{nameof(AuthController.Register)}",
            $"{nameof(AuthController)}.{nameof(AuthController.Login)}"
        };

        Assert.Equal(expectedAnonymousEndpoints, anonymousEndpoints.ToHashSet());
    }

    [Fact]
    public void FallbackPolicy_RequiresAuthenticatedUser()
    {
        var options = new AuthorizationOptions();
        ApiConfiguration.ConfigureAuthorization(options);

        Assert.NotNull(options.FallbackPolicy);
        Assert.Contains(
            options.FallbackPolicy.Requirements,
            req => req is DenyAnonymousAuthorizationRequirement
        );
    }

    [Fact]
    public async Task Request_WithoutAuthorizationHeader_IsChallenged_AndReturns401()
    {
        var (sp, _) = CreateAuthServices();
        var authService = sp.GetRequiredService<IAuthenticationService>();
        var policyEvaluator = sp.GetRequiredService<IPolicyEvaluator>();
        var authOptions = sp.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var fallbackPolicy = authOptions.FallbackPolicy!;

        var context = new DefaultHttpContext { RequestServices = sp };

        var authenticateResult = await authService.AuthenticateAsync(context, JwtBearerDefaults.AuthenticationScheme);
        Assert.False(authenticateResult.Succeeded);
        Assert.True(authenticateResult.None);

        var authResult = await policyEvaluator.AuthenticateAsync(fallbackPolicy, context);
        Assert.False(authResult.Succeeded);

        var authorizeResult = await policyEvaluator.AuthorizeAsync(fallbackPolicy, authResult, context, resource: null);
        Assert.False(authorizeResult.Succeeded);
        Assert.True(authorizeResult.Challenged);

        await authService.ChallengeAsync(context, JwtBearerDefaults.AuthenticationScheme, properties: null);
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task Request_WithManipulatedToken_IsChallenged_AndReturns401()
    {
        var (sp, _) = CreateAuthServices();
        var tokenService = sp.GetRequiredService<TokenService>();
        var validToken = tokenService.CreateToken(new User { Id = Guid.NewGuid(), Username = "test", UsernameNormalized = "TEST" });
        var manipulatedToken = validToken + "invalid-signature-bits";

        await AssertInvalidTokenIsRejectedAndReturns401(sp, manipulatedToken, typeof(SecurityTokenException));
    }

    [Fact]
    public async Task Request_WithWrongSigningKey_IsChallenged_AndReturns401()
    {
        var (sp, jwtSettings) = CreateAuthServices();
        var tokenWithWrongKey = CreateCustomToken(
            key: "different_signing_key_longer_than_32_chars!",
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            expires: DateTime.UtcNow.AddMinutes(30)
        );

        await AssertInvalidTokenIsRejectedAndReturns401(sp, tokenWithWrongKey, typeof(SecurityTokenInvalidSignatureException));
    }

    [Fact]
    public async Task Request_WithWrongIssuer_IsChallenged_AndReturns401()
    {
        var (sp, jwtSettings) = CreateAuthServices();
        var tokenWithWrongIssuer = CreateCustomToken(
            key: jwtSettings.Key,
            issuer: "untrusted-issuer",
            audience: jwtSettings.Audience,
            expires: DateTime.UtcNow.AddMinutes(30)
        );

        await AssertInvalidTokenIsRejectedAndReturns401(sp, tokenWithWrongIssuer, typeof(SecurityTokenInvalidIssuerException));
    }

    [Fact]
    public async Task Request_WithWrongAudience_IsChallenged_AndReturns401()
    {
        var (sp, jwtSettings) = CreateAuthServices();
        var tokenWithWrongAudience = CreateCustomToken(
            key: jwtSettings.Key,
            issuer: jwtSettings.Issuer,
            audience: "untrusted-audience",
            expires: DateTime.UtcNow.AddMinutes(30)
        );

        await AssertInvalidTokenIsRejectedAndReturns401(sp, tokenWithWrongAudience, typeof(SecurityTokenInvalidAudienceException));
    }

    [Fact]
    public async Task Request_WithExpiredToken_IsChallenged_AndReturns401()
    {
        var (sp, jwtSettings) = CreateAuthServices();
        var expiredToken = CreateCustomToken(
            key: jwtSettings.Key,
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            expires: DateTime.UtcNow.AddMinutes(-10)
        );

        await AssertInvalidTokenIsRejectedAndReturns401(sp, expiredToken, typeof(SecurityTokenExpiredException));
    }

    [Fact]
    public async Task Request_WithValidJwt_AuthenticatesAndAuthorizes_AndReturnsUserId()
    {
        var (sp, _) = CreateAuthServices();
        var authService = sp.GetRequiredService<IAuthenticationService>();
        var policyEvaluator = sp.GetRequiredService<IPolicyEvaluator>();
        var authOptions = sp.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var fallbackPolicy = authOptions.FallbackPolicy!;
        var tokenService = sp.GetRequiredService<TokenService>();

        var expectedUserId = Guid.NewGuid();
        var user = new User
        {
            Id = expectedUserId,
            Username = "bokalvan",
            UsernameNormalized = "BOKALVAN",
            PasswordHash = "hash"
        };
        var validToken = tokenService.CreateToken(user);

        var context = new DefaultHttpContext { RequestServices = sp };
        context.Request.Headers.Authorization = $"Bearer {validToken}";

        var authenticateResult = await authService.AuthenticateAsync(context, JwtBearerDefaults.AuthenticationScheme);
        Assert.True(authenticateResult.Succeeded);
        Assert.NotNull(authenticateResult.Principal);

        context.User = authenticateResult.Principal;

        var authResult = await policyEvaluator.AuthenticateAsync(fallbackPolicy, context);
        Assert.True(authResult.Succeeded);

        var authorizeResult = await policyEvaluator.AuthorizeAsync(fallbackPolicy, authResult, context, resource: null);
        Assert.True(authorizeResult.Succeeded);
        Assert.False(authorizeResult.Challenged);

        var actualUserId = context.User.GetUserId();
        Assert.Equal(expectedUserId, actualUserId);

        var subClaim = context.User.FindFirst("sub");
        Assert.NotNull(subClaim);
        Assert.Equal(expectedUserId.ToString(), subClaim.Value);
    }
}
