using System.Security.Claims;

namespace Marginalia.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? principal.FindFirstValue("sub");

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new InvalidOperationException("sub claim not found or not a valid GUID.");

        return userId;
    }
}
