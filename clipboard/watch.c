#include <stdio.h>
#include <gdk/gdk.h>
#include <gtk/gtk.h>
#include "_cgo_export.h"

void handle_owner_change(GtkClipboard *clipboard,
                         GdkEvent *event,
                         gpointer data)
{

    char* text = gtk_clipboard_wait_for_text(clipboard);
    if(text)
    {
        //printf("%s\n", text);
        callback(text);

    } else {
        printf("Thats odd");
    }
    

}

void mainloop() {
	
	gtk_init(NULL, NULL);

    GtkClipboard* clipboard = gtk_clipboard_get(GDK_SELECTION_CLIPBOARD);
    
    g_signal_connect(clipboard, "owner-change",
                     G_CALLBACK(handle_owner_change), NULL);
    gtk_main();

}