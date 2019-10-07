package main

//extern void Callme();
import "C"

import (
	"fmt"
)

func main() {
	fmt.Println("Inside go world")
	C.Callme()
}


//export callback
func callback() {
	fmt.Println("callback called in go world")
}

