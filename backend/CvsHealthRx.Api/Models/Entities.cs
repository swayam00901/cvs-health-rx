using System.ComponentModel.DataAnnotations;

namespace CvsHealthRx.Api.Models;

public class Patient
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required] public string FirebaseUid { get; set; } = default!;
    [Required] public string FullName { get; set; } = default!;
    public DateOnly DateOfBirth { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum RxStatus { Active, RefillPending, Filled, Expired, Cancelled }

public class Prescription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string DrugName { get; set; } = default!;
    public string Dosage { get; set; } = default!;
    public int RefillsRemaining { get; set; }
    public DateTime LastFilledAt { get; set; }
    public DateTime? NextReminderAt { get; set; }
    public RxStatus Status { get; set; } = RxStatus.Active;
    public Guid? PreferredPharmacyId { get; set; }
}

public class Pharmacy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = default!;
    public string Address { get; set; } = default!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Phone { get; set; } = default!;
    public bool OffersVaccines { get; set; }
    public bool OffersMinuteClinic { get; set; }
}

public enum AppointmentKind { Vaccine, MinuteClinic, PharmacistConsult }

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid PharmacyId { get; set; }
    public AppointmentKind Kind { get; set; }
    public DateTime StartsAt { get; set; }
    public int DurationMinutes { get; set; } = 15;
    public string? Notes { get; set; }
}

public class TelehealthVisit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string ProviderName { get; set; } = default!;
    public DateTime ScheduledAt { get; set; }
    public string? SessionToken { get; set; } // short-lived WebRTC token
    public string Status { get; set; } = "scheduled"; // scheduled|in_progress|completed|cancelled
}

// FHIR-inspired shape; real impl would map to Observation / Condition / AllergyIntolerance.
public class EhrRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string ResourceType { get; set; } = default!; // "Observation" | "Condition" | "AllergyIntolerance"
    public string Code { get; set; } = default!;
    public string Display { get; set; } = default!;
    public string? Value { get; set; }
    public DateTime RecordedAt { get; set; }
}
