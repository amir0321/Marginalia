using System.Security.Claims;
using Marginalia.Api.Extensions;

namespace Marginalia.Api.Tests;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetUserId_ThrowsArgumentNullException_WhenPrincipalIsNull()
    {
        ClaimsPrincipal? principal = null;

        Assert.Throws<ArgumentNullException>(() => principal!.GetUserId());
    }

    [Fact]
    public void GetUserId_ReturnsGuid_WhenSubClaimExistsAndIsValidGuid()
    {
        var expectedUserId = Guid.NewGuid();
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", expectedUserId.ToString())
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var actualUserId = principal.GetUserId();

        Assert.Equal(expectedUserId, actualUserId);
    }

    [Fact]
    public void GetUserId_FallsBackToNameIdentifier_WhenSubClaimIsMissing()
    {
        var expectedUserId = Guid.NewGuid();
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, expectedUserId.ToString())
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var actualUserId = principal.GetUserId();

        Assert.Equal(expectedUserId, actualUserId);
    }

    [Fact]
    public void GetUserId_PrioritizesSubClaim_WhenBothSubAndNameIdentifierArePresent()
    {
        var subUserId = Guid.NewGuid();
        var nameIdUserId = Guid.NewGuid();
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", subUserId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, nameIdUserId.ToString())
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var actualUserId = principal.GetUserId();

        Assert.Equal(subUserId, actualUserId);
    }

    [Fact]
    public void GetUserId_ThrowsInvalidOperationException_WhenNeitherSubNorNameIdentifierPresent()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Name, "some-username")
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var ex = Assert.Throws<InvalidOperationException>(() => principal.GetUserId());
        Assert.Equal("sub claim not found or not a valid GUID.", ex.Message);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("abc-def")]
    public void GetUserId_ThrowsInvalidOperationException_WhenSubIsNotValidGuid(string invalidGuid)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", invalidGuid)
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var ex = Assert.Throws<InvalidOperationException>(() => principal.GetUserId());
        Assert.Equal("sub claim not found or not a valid GUID.", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void GetUserId_ThrowsInvalidOperationException_WhenSubIsEmptyOrWhitespace(string whitespace)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", whitespace)
        }, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var ex = Assert.Throws<InvalidOperationException>(() => principal.GetUserId());
        Assert.Equal("sub claim not found or not a valid GUID.", ex.Message);
    }
}
