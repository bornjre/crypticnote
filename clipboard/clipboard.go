package clipboard

// #cgo pkg-config: gtk+-2.0
//extern void mainloop();
import "C"

import (
	"fmt"
)

var (
	static_clippy *ClipBoard
)

type ClipBoard struct {
	out chan<- string
}

func NewClipBoard() *ClipBoard {
	if static_clippy != nil {
		panic("Clipboard watch service should not be called twice")
	}

	clippy := &ClipBoard{}
	static_clippy = clippy
	return clippy
}

func (p *ClipBoard) SetPullChan(c chan<- string) {
	p.out = c
}

func (p *ClipBoard) Start() {
	fmt.Println("<GO> Starting clipboard watch service")
	go C.mainloop()
}

func (p *ClipBoard) Stop() {}

func (p *ClipBoard) push(message string) {
	fmt.Println("pushing event")
	p.out <- message

}

//export callback
func callback(str *C.char) {
	msg := C.GoString(str)
	fmt.Println("<GO> copy event")
	fmt.Println(msg)
	go static_clippy.push(msg)
}
