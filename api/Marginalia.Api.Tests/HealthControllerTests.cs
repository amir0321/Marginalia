using Microsoft.AspNetCore.Mvc;
using Marginalia.Api.Controllers;

namespace Marginalia.Api.Tests;

public class HealthControllerTests
{
    [Fact]
    public void Get_ReturnsOkResult_WithStatusOk()
    {
        var controller = new HealthController();

        var result = controller.Get();

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}
