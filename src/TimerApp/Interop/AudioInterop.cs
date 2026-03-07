using Microsoft.JSInterop;

namespace TimerApp.Interop;

public static class AudioInterop
{
    public static async Task InitializeAsync(IJSRuntime js)
    {
        await js.InvokeVoidAsync("audioInterop.initialize");
    }

    public static async Task PlayAlarmAsync(IJSRuntime js)
    {
        await js.InvokeVoidAsync("audioInterop.playAlarm");
    }

    public static async Task VibrateAsync(IJSRuntime js)
    {
        await js.InvokeVoidAsync("audioInterop.vibrate");
    }
}
