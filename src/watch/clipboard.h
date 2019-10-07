#include <gdk/gdk.h>
#include <gtk/gtk.h>

//gcc clipboard.c `pkg-config --cflags --libs gtk+-2.0`

void handle_owner_change(GtkClipboard *clipboard,
                         GdkEvent *event,
                         gpointer data)
{

    char* text = gtk_clipboard_wait_for_text(clipboard);
    if(text)
    {
        printf("%s\n", text);
    }
}

void mainloop() {
    GtkClipboard* clipboard = gtk_clipboard_get(GDK_SELECTION_CLIPBOARD);
    
    g_signal_connect(clipboard, "owner-change",
                     G_CALLBACK(handle_owner_change), NULL);
    gtk_main();

}