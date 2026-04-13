using CvsHealthRx.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CvsHealthRx.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/patients/{patientId:guid}/prescriptions")]
public class PrescriptionsController(IPrescriptionService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid patientId, CancellationToken ct)
        => Ok(await svc.ForPatientAsync(patientId, ct));

    [HttpPost("{rxId:guid}/refill")]
    public async Task<IActionResult> Refill(Guid rxId, CancellationToken ct)
    {
        try { return Ok(await svc.RefillAsync(rxId, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
