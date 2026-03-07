namespace TimerApp.Services;

public interface ITimerService : IAsyncDisposable
{
    int MaxMinutes { get; }
    int MinutesPerRotation { get; }

    TimerState State { get; }
    TimeSpan RemainingTime { get; }
    TimeSpan TotalDuration { get; }
    int TotalMinutes { get; }
    int Rotations { get; }
    int CurrentRotationMinutes { get; }
    bool CanStart { get; }
    bool CanPause { get; }
    bool CanResume { get; }
    bool IsRunning { get; }

    event Action<TimeSpan>? OnTick;
    event Action? OnFinished;
    event Action<TimerState>? OnStateChanged;

    void SetDuration(int minutes);
    void AddMinutes(int minutes);
    void Start();
    void Pause();
    void Resume();
    void Reset();
    void Repeat();
}
