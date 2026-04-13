using CvsHealthRx.Api.Models;
using CvsHealthRx.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CvsHealthRx.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/telehealth")]
public class TelehealthController(ITelehealthService svc) : ControllerBase
{
    public record ScheduleRequest(Guid PatientId, string ProviderName, DateTime ScheduledAt);

    [HttpPost("visits")]
    public async Task<IActionResult> Schedule([FromBody] ScheduleRequest r, CancellationToken ct)
    {
        var v = new TelehealthVisit { PatientId = r.PatientId, ProviderName = r.ProviderName, ScheduledAt = r.ScheduledAt };
        return Ok(await svc.ScheduleAsync(v, ct));
    }

    [HttpPost("visits/{visitId:guid}/join")]
    public async Task<IActionResult> Join(Guid visitId, CancellationToken ct)
    {
        try { return Ok(new { sessionToken = await svc.IssueSessionTokenAsync(visitId, ct) }); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
