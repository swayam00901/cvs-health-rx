using CvsHealthRx.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvsHealthRx.Api.Data;

public class RxDbContext : DbContext
{
    public RxDbContext(DbContextOptions<RxDbContext> opts) : base(opts) { }

    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<Pharmacy> Pharmacies => Set<Pharmacy>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<TelehealthVisit> TelehealthVisits => Set<TelehealthVisit>();
    public DbSet<EhrRecord> EhrRecords => Set<EhrRecord>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Patient>().HasIndex(p => p.FirebaseUid).IsUnique();
        b.Entity<Prescription>().HasIndex(p => new { p.PatientId, p.Status });
        b.Entity<Pharmacy>().HasIndex(p => new { p.Latitude, p.Longitude });
        b.Entity<Appointment>().HasIndex(a => new { a.PatientId, a.StartsAt });
    }
}
