using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Marginalia.Api.Data;

namespace Marginalia.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        var canConnect = await db.Database.CanConnectAsync(cancellationToken);
        if (!canConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unavailable" });
        }

        return Ok(new { status = "ok" });
    }
}
