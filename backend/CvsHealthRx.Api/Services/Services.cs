using CvsHealthRx.Api.Data;
using CvsHealthRx.Api.Models;
using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;

namespace CvsHealthRx.Api.Services;

public interface IPrescriptionService
{
    Task<IReadOnlyList<Prescription>> ForPatientAsync(Guid patientId, CancellationToken ct);
    Task<Prescription> RefillAsync(Guid rxId, CancellationToken ct);
}

public class PrescriptionService(RxDbContext db, INotificationService notifier) : IPrescriptionService
{
    public async Task<IReadOnlyList<Prescription>> ForPatientAsync(Guid patientId, CancellationToken ct)
        => await db.Prescriptions.Where(p => p.PatientId == patientId)
                                 .OrderByDescending(p => p.LastFilledAt)
                                 .ToListAsync(ct);

    public async Task<Prescription> RefillAsync(Guid rxId, CancellationToken ct)
    {
        var rx = await db.Prescriptions.FirstOrDefaultAsync(p => p.Id == rxId, ct)
                 ?? throw new KeyNotFoundException("Prescription not found");
        if (rx.RefillsRemaining <= 0) throw new InvalidOperationException("No refills remaining");
        rx.RefillsRemaining--;
        rx.Status = RxStatus.RefillPending;
        rx.LastFilledAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await notifier.SendToPatientAsync(rx.PatientId, "Refill requested",
            $"Your refill for {rx.DrugName} is being processed.", ct);
        return rx;
    }
}

public interface IPharmacyService
{
    Task<IReadOnlyList<Pharmacy>> NearbyAsync(double lat, double lon, double radiusKm, CancellationToken ct);
    Task<Appointment> BookAsync(Appointment appt, CancellationToken ct);
}

public class PharmacyService(RxDbContext db) : IPharmacyService
{
    public async Task<IReadOnlyList<Pharmacy>> NearbyAsync(double lat, double lon, double radiusKm, CancellationToken ct)
    {
        // Rough bounding box; real impl would use PostGIS ST_DWithin.
        var delta = radiusKm / 111.0;
        return await db.Pharmacies
            .Where(p => p.Latitude > lat - delta && p.Latitude < lat + delta
                     && p.Longitude > lon - delta && p.Longitude < lon + delta)
            .Take(50)
            .ToListAsync(ct);
    }

    public async Task<Appointment> BookAsync(Appointment appt, CancellationToken ct)
    {
        db.Appointments.Add(appt);
        await db.SaveChangesAsync(ct);
        return appt;
    }
}

public interface ITelehealthService
{
    Task<TelehealthVisit> ScheduleAsync(TelehealthVisit v, CancellationToken ct);
    Task<string> IssueSessionTokenAsync(Guid visitId, CancellationToken ct);
}

public class TelehealthService(RxDbContext db) : ITelehealthService
{
    public async Task<TelehealthVisit> ScheduleAsync(TelehealthVisit v, CancellationToken ct)
    {
        db.TelehealthVisits.Add(v);
        await db.SaveChangesAsync(ct);
        return v;
    }

    public async Task<string> IssueSessionTokenAsync(Guid visitId, CancellationToken ct)
    {
        var visit = await db.TelehealthVisits.FindAsync(new object?[] { visitId }, ct)
                    ?? throw new KeyNotFoundException();
        // In prod: call Twilio/Daily/Agora to mint a short-lived room token.
        visit.SessionToken = Guid.NewGuid().ToString("N");
        visit.Status = "in_progress";
        await db.SaveChangesAsync(ct);
        return visit.SessionToken;
    }
}

public interface IEhrService
{
    Task<IReadOnlyList<EhrRecord>> RecordsForPatientAsync(Guid patientId, string? resourceType, CancellationToken ct);
}

public class EhrService(RxDbContext db) : IEhrService
{
    public async Task<IReadOnlyList<EhrRecord>> RecordsForPatientAsync(Guid patientId, string? resourceType, CancellationToken ct)
    {
        var q = db.EhrRecords.Where(r => r.PatientId == patientId);
        if (!string.IsNullOrEmpty(resourceType)) q = q.Where(r => r.ResourceType == resourceType);
        return await q.OrderByDescending(r => r.RecordedAt).Take(200).ToListAsync(ct);
    }
}

public interface INotificationService
{
    Task SendToPatientAsync(Guid patientId, string title, string body, CancellationToken ct);
}

public class FcmNotificationService(RxDbContext db, ILogger<FcmNotificationService> log) : INotificationService
{
    public async Task SendToPatientAsync(Guid patientId, string title, string body, CancellationToken ct)
    {
        var patient = await db.Patients.FindAsync(new object?[] { patientId }, ct);
        if (patient is null) return;
        try
        {
            // Real impl: look up FCM token from DeviceTokens table keyed by FirebaseUid.
            var message = new Message
            {
                Topic = $"patient_{patient.FirebaseUid}",
                Notification = new Notification { Title = title, Body = body }
            };
            await FirebaseMessaging.DefaultInstance.SendAsync(message, ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "FCM send failed for patient {PatientId}", patientId);
        }
    }
}
