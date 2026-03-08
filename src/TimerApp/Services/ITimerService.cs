namespace TimerApp.Services;

public interface ITimerService : IAsyncDisposable
{
    int MaxSeconds { get; }
    int SecondsPerRotation { get; }

    TimerState State { get; }
    TimeSpan RemainingTime { get; }
    TimeSpan TotalDuration { get; }
    int TotalSeconds { get; }
    int Rotations { get; }
    int CurrentRotationSeconds { get; }
    bool CanStart { get; }
    bool CanPause { get; }
    bool CanResume { get; }
    bool IsRunning { get; }

    event Action<TimeSpan>? OnTick;
    event Action? OnFinished;
    event Action<TimerState>? OnStateChanged;

    void SetDuration(int totalSeconds);
    void AddSeconds(int seconds);
    void Start();
    void Pause();
    void Resume();
    void Reset();
    void Repeat();
}
