package main

// #cgo pkg-config: gtk+-2.0
//extern void mainloop();
import "C"

import (
	"fmt"
	"sync"
)

func main() {
	fmt.Println("<GO> Starting clipboard watch service")
	
	var wg sync.WaitGroup
	wg.Add(1)
	go C.mainloop()
	wg.Wait()

}


//export callback
func callback(str *C.char) {
	fmt.Println("<GO> copy event")
	fmt.Println(C.GoString(str))
}

