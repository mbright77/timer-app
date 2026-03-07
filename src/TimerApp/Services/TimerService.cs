namespace TimerApp.Services;

public enum TimerState
{
    Idle,
    SetTime,
    Running,
    Paused,
    Finished
}

public sealed class TimerService : IAsyncDisposable
{
    public const int MaxMinutes = 160;
    public const int MinutesPerRotation = 60;

    private PeriodicTimer? _timer;
    private CancellationTokenSource? _cts;
    private TimeSpan _remainingTime;
    private TimeSpan _totalDuration;
    private TimerState _state = TimerState.Idle;

    public event Action<TimeSpan>? OnTick;
    public event Action? OnFinished;
    public event Action<TimerState>? OnStateChanged;

    public TimerState State
    {
        get => _state;
        private set
        {
            if (_state != value)
            {
                _state = value;
                OnStateChanged?.Invoke(value);
            }
        }
    }

    public TimeSpan RemainingTime => _remainingTime;
    public TimeSpan TotalDuration => _totalDuration;
    public int TotalMinutes => (int)_totalDuration.TotalMinutes;
    public int Rotations => TotalMinutes / MinutesPerRotation;
    public int CurrentRotationMinutes => TotalMinutes % MinutesPerRotation;

    public bool CanStart => State == TimerState.SetTime && _totalDuration.TotalSeconds > 0;
    public bool CanPause => State == TimerState.Running;
    public bool CanResume => State == TimerState.Paused;
    public bool IsRunning => State == TimerState.Running || State == TimerState.Paused;

    public void SetDuration(int minutes)
    {
        minutes = Math.Clamp(minutes, 0, MaxMinutes);
        _totalDuration = TimeSpan.FromMinutes(minutes);
        _remainingTime = _totalDuration;

        if (minutes > 0)
        {
            State = TimerState.SetTime;
        }
        else
        {
            State = TimerState.Idle;
        }
    }

    public void AddMinutes(int minutes)
    {
        var newMinutes = TotalMinutes + minutes;
        SetDuration(newMinutes);
    }

    public void Start()
    {
        if (!CanStart) return;

        _remainingTime = _totalDuration;
        State = TimerState.Running;
        StartTimer();
    }

    public void Pause()
    {
        if (!CanPause) return;

        StopTimer();
        State = TimerState.Paused;
    }

    public void Resume()
    {
        if (!CanResume) return;

        State = TimerState.Running;
        StartTimer();
    }

    public void Reset()
    {
        StopTimer();
        _remainingTime = TimeSpan.Zero;
        _totalDuration = TimeSpan.Zero;
        State = TimerState.Idle;
    }

    public void Repeat()
    {
        var duration = _totalDuration;
        Reset();
        _totalDuration = duration;
        _remainingTime = duration;
        if (duration > TimeSpan.Zero)
        {
            State = TimerState.SetTime;
        }
        Start();
    }

    private void StartTimer()
    {
        _cts = new CancellationTokenSource();
        _timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        _ = TickAsync(_cts.Token);
    }

    private void StopTimer()
    {
        _cts?.Cancel();
        _timer?.Dispose();
        _timer = null;
        _cts?.Dispose();
        _cts = null;
    }

    private async Task TickAsync(CancellationToken ct)
    {
        while (_timer is { } timer && await timer.WaitForNextTickAsync(ct))
        {
            _remainingTime = _remainingTime.Subtract(TimeSpan.FromSeconds(1));
            OnTick?.Invoke(_remainingTime);

            if (_remainingTime <= TimeSpan.Zero)
            {
                _remainingTime = TimeSpan.Zero;
                StopTimer();
                State = TimerState.Finished;
                OnFinished?.Invoke();
                break;
            }
        }
    }

    public ValueTask DisposeAsync()
    {
        StopTimer();
        return ValueTask.CompletedTask;
    }
}
