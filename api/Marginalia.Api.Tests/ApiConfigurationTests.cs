using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using Marginalia.Api.Configuration;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

namespace Marginalia.Api.Tests;

public class ApiConfigurationTests
{
    private static IConfiguration CreateConfig(Dictionary<string, string?> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GetRequiredDefaultConnectionString_ThrowsInvalidOperationException_WhenMissingOrWhitespace(string? connectionString)
    {
        var config = CreateConfig(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = connectionString,
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            ApiConfiguration.GetRequiredDefaultConnectionString(config));

        Assert.Contains("ConnectionStrings:Default saknas", ex.Message);
    }

    [Fact]
    public void GetRequiredDefaultConnectionString_ReturnsConnectionString_WhenValid()
    {
        const string expected = "Host=localhost;Database=marginalia";
        var config = CreateConfig(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = expected,
        });

        var actual = ApiConfiguration.GetRequiredDefaultConnectionString(config);

        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("short_key_under_32_characters!")]
    public void GetValidatedJwtSettings_ThrowsInvalidOperationException_WhenKeyMissingOrTooShort(string? key)
    {
        var config = CreateConfig(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = key,
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            ApiConfiguration.GetValidatedJwtSettings(config));

        Assert.Contains("Jwt:Key saknas eller är kortare än 32 tecken", ex.Message);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("inte-ett-tal")]
    public void GetValidatedJwtSettings_ThrowsInvalidOperationException_WhenExpiresMinutesIsInvalid(string invalidExpires)
    {
        var config = CreateConfig(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "this_key_is_longer_than_thirty_two_chars_long",
            ["Jwt:ExpiresMinutes"] = invalidExpires,
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            ApiConfiguration.GetValidatedJwtSettings(config));

        Assert.Contains("Jwt:ExpiresMinutes", ex.Message);
    }

    [Theory]
    [InlineData(null, null, null)]
    [InlineData("", "", "")]
    [InlineData("   ", "   ", "   ")]
    public void GetValidatedJwtSettings_AppliesFallbacks_WhenIssuerAudienceOrExpiresAreEmpty(
        string? issuer, string? audience, string? expires)
    {
        var config = CreateConfig(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "this_key_is_longer_than_thirty_two_chars_long",
            ["Jwt:Issuer"] = issuer,
            ["Jwt:Audience"] = audience,
            ["Jwt:ExpiresMinutes"] = expires,
        });

        var settings = ApiConfiguration.GetValidatedJwtSettings(config);

        Assert.Equal("marginalia", settings.Issuer);
        Assert.Equal("marginalia-web", settings.Audience);
        Assert.Equal(60, settings.ExpiresMinutes);
        Assert.Equal("this_key_is_longer_than_thirty_two_chars_long", settings.Key);
    }

    [Fact]
    public void TokenFromTokenService_SuccessfullyValidates_WithCreatedTokenValidationParameters()
    {
        var settings = new JwtSettings
        {
            Key = "a_very_secure_test_signing_key_32_chars_long!",
            Issuer = "marginalia-test",
            Audience = "marginalia-test-aud",
            ExpiresMinutes = 30,
        };

        var service = new TokenService(settings);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "bokslukaren",
            UsernameNormalized = "BOKSLUKAREN",
            PasswordHash = "hash",
        };

        var tokenString = service.CreateToken(user);
        var validationParameters = settings.CreateTokenValidationParameters();

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(tokenString, validationParameters, out var validatedToken);

        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);
        Assert.Equal(TimeSpan.FromMinutes(1), validationParameters.ClockSkew);
    }
}
