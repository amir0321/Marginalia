using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Marginalia.Api.Configuration;
using Marginalia.Api.Data;
using Marginalia.Api.Models;
using Marginalia.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 2;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var connectionString = ApiConfiguration.GetRequiredDefaultConnectionString(builder.Configuration);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql =>
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null
        )
    )
);

var jwtSettings = ApiConfiguration.GetValidatedJwtSettings(builder.Configuration);
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddMarginaliaAuth(jwtSettings);
builder.Services.AddMarginaliaRateLimiting();

builder.Services.AddScoped(sp => new TokenService(sp.GetRequiredService<JwtSettings>()));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseForwardedHeaders();

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.Headers.Append("Cache-Control", "no-store");
    }

    await next();
});

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
