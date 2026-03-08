using TimerApp.Services;

namespace TimerApp.Tests;

public class TimerServiceTests : IAsyncDisposable
{
    private readonly TimerService _sut = new();

    public async ValueTask DisposeAsync()
    {
        await _sut.DisposeAsync();
    }

    [Fact]
    public void InitialState_IsIdleWithZeroDuration()
    {
        Assert.Equal(TimerState.Idle, _sut.State);
        Assert.Equal(TimeSpan.Zero, _sut.TotalDuration);
        Assert.Equal(TimeSpan.Zero, _sut.RemainingTime);
        Assert.Equal(0, _sut.TotalSeconds);
        Assert.Equal(0, _sut.CurrentRotationSeconds);
        Assert.False(_sut.CanStart);
        Assert.False(_sut.CanPause);
        Assert.False(_sut.CanResume);
        Assert.False(_sut.IsRunning);
    }

    [Fact]
    public void SetDuration_PositiveSeconds_TransitionsToSetTime()
    {
        _sut.SetDuration(300);

        Assert.Equal(TimerState.SetTime, _sut.State);
        Assert.Equal(TimeSpan.FromSeconds(300), _sut.TotalDuration);
        Assert.Equal(TimeSpan.FromSeconds(300), _sut.RemainingTime);
        Assert.Equal(300, _sut.TotalSeconds);
        Assert.True(_sut.CanStart);
    }

    [Fact]
    public void SetDuration_Zero_StaysIdle()
    {
        _sut.SetDuration(0);

        Assert.Equal(TimerState.Idle, _sut.State);
        Assert.Equal(TimeSpan.Zero, _sut.TotalDuration);
        Assert.Equal(0, _sut.TotalSeconds);
    }

    [Fact]
    public void SetDuration_ClampsToBounds()
    {
        _sut.SetDuration(-1);
        Assert.Equal(0, _sut.TotalSeconds);
        Assert.Equal(TimerState.Idle, _sut.State);

        _sut.SetDuration(TimerService.MaxSeconds + 1);
        Assert.Equal(TimerService.MaxSeconds, _sut.TotalSeconds);
        Assert.Equal(TimerState.SetTime, _sut.State);
    }

    [Fact]
    public void SetDuration_MaxSecondsIs1800()
    {
        Assert.Equal(1800, TimerService.MaxSeconds);
    }

    [Fact]
    public void RotationValues_TrackThirtyMinuteSingleRotation()
    {
        _sut.SetDuration(299);
        Assert.Equal(0, _sut.Rotations);
        Assert.Equal(299, _sut.CurrentRotationSeconds);

        _sut.SetDuration(300);
        Assert.Equal(0, _sut.Rotations);
        Assert.Equal(300, _sut.CurrentRotationSeconds);

        _sut.SetDuration(1800);
        Assert.Equal(0, _sut.Rotations);
        Assert.Equal(1800, _sut.CurrentRotationSeconds);
    }

    [Fact]
    public void AddSeconds_AdjustsDurationAndClamps()
    {
        _sut.SetDuration(600);
        _sut.AddSeconds(120);
        Assert.Equal(720, _sut.TotalSeconds);

        _sut.AddSeconds(-1000);
        Assert.Equal(0, _sut.TotalSeconds);
        Assert.Equal(TimerState.Idle, _sut.State);

        _sut.SetDuration(1750);
        _sut.AddSeconds(100);
        Assert.Equal(TimerService.MaxSeconds, _sut.TotalSeconds);
    }

    [Fact]
    public void AddSeconds_CrossesThresholdBoundaries()
    {
        _sut.SetDuration(299);
        _sut.AddSeconds(1);
        Assert.Equal(300, _sut.TotalSeconds);

        _sut.AddSeconds(-1);
        Assert.Equal(299, _sut.TotalSeconds);
    }

    [Fact]
    public void StartPauseResumeResetRepeat_WorkAsExpected()
    {
        _sut.Start();
        Assert.Equal(TimerState.Idle, _sut.State);

        _sut.SetDuration(120);
        _sut.Start();
        Assert.Equal(TimerState.Running, _sut.State);
        Assert.True(_sut.IsRunning);

        _sut.Pause();
        Assert.Equal(TimerState.Paused, _sut.State);
        Assert.True(_sut.CanResume);

        _sut.Resume();
        Assert.Equal(TimerState.Running, _sut.State);

        _sut.Reset();
        Assert.Equal(TimerState.Idle, _sut.State);
        Assert.Equal(0, _sut.TotalSeconds);

        _sut.SetDuration(120);
        _sut.Start();
        _sut.Pause();
        var originalDuration = _sut.TotalDuration;
        _sut.Repeat();
        Assert.Equal(TimerState.Running, _sut.State);
        Assert.Equal(originalDuration, _sut.TotalDuration);
        Assert.Equal(originalDuration, _sut.RemainingTime);
    }

    [Fact]
    public void OnStateChanged_FiresOnlyOnTransitions()
    {
        var states = new List<TimerState>();
        _sut.OnStateChanged += s => states.Add(s);

        _sut.SetDuration(60);
        _sut.SetDuration(120);
        _sut.Start();

        Assert.Equal(2, states.Count);
        Assert.Equal(TimerState.SetTime, states[0]);
        Assert.Equal(TimerState.Running, states[1]);
    }

    [Fact]
    public async Task Tick_DecrementsBySecond()
    {
        var tickReceived = new TaskCompletionSource<TimeSpan>();
        _sut.OnTick += remaining => tickReceived.TrySetResult(remaining);

        _sut.SetDuration(2);
        _sut.Start();

        var remaining = await tickReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(TimeSpan.FromSeconds(1), remaining);
    }

    [Fact]
    public async Task Timer_Finishes_WhenRemainingReachesZero()
    {
        var finishedReceived = new TaskCompletionSource<bool>();
        _sut.OnFinished += () => finishedReceived.TrySetResult(true);

        _sut.SetDuration(1);
        _sut.Start();

        await finishedReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(TimerState.Finished, _sut.State);
        Assert.Equal(TimeSpan.Zero, _sut.RemainingTime);
    }

    [Fact]
    public async Task DisposeAsync_StopsTimer()
    {
        _sut.SetDuration(120);
        _sut.Start();
        await _sut.DisposeAsync();

        var tickCount = 0;
        _sut.OnTick += _ => tickCount++;
        await Task.Delay(1500);

        Assert.Equal(0, tickCount);
    }
}
