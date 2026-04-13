using CvsHealthRx.Api.Data;
using CvsHealthRx.Api.Services;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Logging (HIPAA-minded: no PHI in logs) ---
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console()
    .Enrich.WithProperty("service", "cvs-health-rx-api"));

// --- DB: Cloud SQL Postgres via EF Core ---
var connStr = builder.Configuration.GetConnectionString("Postgres")
    ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
builder.Services.AddDbContext<RxDbContext>(opts => opts.UseNpgsql(connStr));

// --- Firebase Admin: validates mobile-issued ID tokens, sends FCM pushes ---
FirebaseApp.Create(new AppOptions { Credential = GoogleCredential.GetApplicationDefault() });

// --- AuthN: accept Firebase-issued JWTs ---
var projectId = builder.Configuration["Gcp:ProjectId"] ?? "cvs-health-rx-dev";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.Authority = $"https://securetoken.google.com/{projectId}";
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = $"https://securetoken.google.com/{projectId}",
            ValidateAudience = true,
            ValidAudience = projectId,
            ValidateLifetime = true
        };
    });
builder.Services.AddAuthorization();

// --- Services ---
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IPharmacyService, PharmacyService>();
builder.Services.AddScoped<ITelehealthService, TelehealthService>();
builder.Services.AddScoped<IEhrService, EhrService>();
builder.Services.AddScoped<INotificationService, FcmNotificationService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "*" })
     .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddHealthChecks().AddDbContextCheck<RxDbContext>();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/healthz");

// Auto-migrate in non-prod only
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<RxDbContext>().Database.Migrate();
}

app.Run();
