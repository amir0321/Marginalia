using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Marginalia.Api.Dtos;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

namespace Marginalia.Api.Tests;

public class TokenServiceTests
{
    private readonly IConfiguration _configuration;

    public TokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "this_is_a_very_secure_test_key_with_at_least_32_characters" },
            { "Jwt:Issuer", "Marginalia.Api.TestIssuer" },
            { "Jwt:Audience", "Marginalia.Web.TestAudience" },
            { "Jwt:ExpiresMinutes", "60" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public void CreateToken_ReturnsValidJwt_WithExpectedClaims()
    {
        var service = new TokenService(_configuration);
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "bokmalen",
            UsernameNormalized = "BOKMALEN",
            PasswordHash = "hash"
        };

        var tokenString = service.CreateToken(user);

        Assert.False(string.IsNullOrWhiteSpace(tokenString));

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(tokenString));

        var jwtToken = handler.ReadJwtToken(tokenString);
        Assert.Equal("Marginalia.Api.TestIssuer", jwtToken.Issuer);
        Assert.Contains("Marginalia.Web.TestAudience", jwtToken.Audiences);

        var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(subClaim);
        Assert.Equal(userId.ToString(), subClaim.Value);

        var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.UniqueName);
        Assert.NotNull(nameClaim);
        Assert.Equal("bokmalen", nameClaim.Value);

        var jtiClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti);
        Assert.NotNull(jtiClaim);
        Assert.False(string.IsNullOrWhiteSpace(jtiClaim.Value));

        Assert.Equal(SecurityAlgorithms.HmacSha256, jwtToken.Header.Alg);
        Assert.True(jwtToken.ValidTo > DateTime.UtcNow);
        var expectedExpires = DateTime.UtcNow.AddMinutes(60);
        var diff = (jwtToken.ValidTo - expectedExpires).Duration();
        Assert.True(diff < TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreateToken_UsesHs256_AndConfigured60MinuteLifetime()
    {
        var service = new TokenService(_configuration);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            UsernameNormalized = "TESTUSER",
            PasswordHash = "hash"
        };

        var tokenString = service.CreateToken(user);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        Assert.Equal(SecurityAlgorithms.HmacSha256, jwtToken.Header.Alg);
        var expectedExpires = DateTime.UtcNow.AddMinutes(60);
        var diff = (jwtToken.ValidTo - expectedExpires).Duration();
        Assert.True(diff < TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreateAuthResponse_ReturnsExpectedResponse_AndMatchingJwtValidTo()
    {
        var service = new TokenService(_configuration);
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "bokmalen",
            UsernameNormalized = "BOKMALEN",
            PasswordHash = "hash"
        };

        var response = service.CreateAuthResponse(user);

        Assert.NotNull(response);
        Assert.Equal("bokmalen", response.Username);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal(DateTimeKind.Utc, response.ExpiresAt.Kind);
        Assert.True(response.ExpiresAt > DateTime.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(response.Token));

        var jwtToken = handler.ReadJwtToken(response.Token);
        var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(subClaim);
        Assert.Equal(userId.ToString(), subClaim.Value);

        var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.UniqueName);
        Assert.NotNull(nameClaim);
        Assert.Equal("bokmalen", nameClaim.Value);

        var diff = (response.ExpiresAt - jwtToken.ValidTo).Duration();
        Assert.True(diff < TimeSpan.FromSeconds(2));
    }
}
