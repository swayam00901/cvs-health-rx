using CvsHealthRx.Api.Models;
using CvsHealthRx.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CvsHealthRx.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pharmacies")]
public class PharmaciesController(IPharmacyService svc) : ControllerBase
{
    public record NearbyQuery(double Lat, double Lon, double RadiusKm = 10);
    public record BookAppointmentRequest(Guid PatientId, Guid PharmacyId, AppointmentKind Kind, DateTime StartsAt, string? Notes);

    [HttpGet("nearby")]
    public async Task<IActionResult> Nearby([FromQuery] NearbyQuery q, CancellationToken ct)
        => Ok(await svc.NearbyAsync(q.Lat, q.Lon, q.RadiusKm, ct));

    [HttpPost("appointments")]
    public async Task<IActionResult> Book([FromBody] BookAppointmentRequest req, CancellationToken ct)
    {
        var appt = new Appointment
        {
            PatientId = req.PatientId,
            PharmacyId = req.PharmacyId,
            Kind = req.Kind,
            StartsAt = req.StartsAt,
            Notes = req.Notes
        };
        var created = await svc.BookAsync(appt, ct);
        return CreatedAtAction(nameof(Book), new { id = created.Id }, created);
    }
}
