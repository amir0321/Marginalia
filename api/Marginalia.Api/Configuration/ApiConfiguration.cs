using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Marginalia.Api.Configuration;

public class JwtSettings
{
    public required string Key { get; init; }
    public string Issuer { get; init; } = "marginalia";
    public string Audience { get; init; } = "marginalia-web";
    public int ExpiresMinutes { get; init; } = 60;

    public TokenValidationParameters CreateTokenValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Issuer,
            ValidAudience = Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    }
}

public static class ApiConfiguration
{
    public static string GetRequiredDefaultConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Konfigurationsfel: ConnectionStrings:Default saknas. " +
                "Kör: dotnet user-secrets set \"ConnectionStrings:Default\" \"Host=...\""
            );
        }

        return connectionString;
    }

    public static JwtSettings GetValidatedJwtSettings(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
        {
            throw new InvalidOperationException(
                "Konfigurationsfel: Jwt:Key saknas eller är kortare än 32 tecken. " +
                "Kör: dotnet user-secrets set \"Jwt:Key\" \"<minst-32-tecken>\""
            );
        }

        var rawExpires = configuration["Jwt:ExpiresMinutes"];
        var expiresMinutes = 60;
        if (!string.IsNullOrWhiteSpace(rawExpires))
        {
            if (!int.TryParse(rawExpires, out expiresMinutes) || expiresMinutes <= 0)
            {
                throw new InvalidOperationException(
                    "Konfigurationsfel: Jwt:ExpiresMinutes måste vara ett positivt heltal större än 0."
                );
            }
        }

        var issuer = configuration["Jwt:Issuer"];
        if (string.IsNullOrWhiteSpace(issuer))
        {
            issuer = "marginalia";
        }

        var audience = configuration["Jwt:Audience"];
        if (string.IsNullOrWhiteSpace(audience))
        {
            audience = "marginalia-web";
        }

        return new JwtSettings
        {
            Key = key,
            Issuer = issuer,
            Audience = audience,
            ExpiresMinutes = expiresMinutes,
        };
    }
}
