use tauri::EventLoopMessage;
use tauri_runtime_wry::{
    Context, EventLoopIterationContext, Message, Plugin, PluginBuilder, WebContextStore,
    WindowMessage,
    tao::{
        event::Event,
        event_loop::{ControlFlow, EventLoopProxy, EventLoopWindowTarget},
    },
};

pub(super) struct Fullscreen;

impl PluginBuilder<EventLoopMessage> for Fullscreen {
    type Plugin = Self;

    fn build(self, _context: Context<EventLoopMessage>) -> Self {
        self
    }
}

impl Plugin<EventLoopMessage> for Fullscreen {
    fn on_event(
        &mut self,
        event: &Event<Message<EventLoopMessage>>,
        _event_loop: &EventLoopWindowTarget<Message<EventLoopMessage>>,
        _proxy: &EventLoopProxy<Message<EventLoopMessage>>,
        _control_flow: &mut ControlFlow,
        context: EventLoopIterationContext<'_, EventLoopMessage>,
        _web_context: &WebContextStore,
    ) -> bool {
        // On Windows, Tauri queues this message when a WebView exits HTML fullscreen.
        // The app owns its fullscreen state: consume the message before Tao resizes
        // the window. Restoring fullscreen afterwards causes a visible flash.
        if let Event::UserEvent(Message::Window(id, WindowMessage::SetFullscreen(false))) = event {
            return context
                .windows
                .0
                .borrow()
                .get(id)
                .is_some_and(|window| window.label() == "app");
        }
        false
    }
}
