using CvsHealthRx.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CvsHealthRx.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/patients/{patientId:guid}/ehr")]
public class EhrController(IEhrService svc) : ControllerBase
{
    // FHIR-shaped read; ?resourceType=Observation|Condition|AllergyIntolerance
    [HttpGet]
    public async Task<IActionResult> Get(Guid patientId, [FromQuery] string? resourceType, CancellationToken ct)
        => Ok(await svc.RecordsForPatientAsync(patientId, resourceType, ct));
}
