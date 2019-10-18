package main

import (
	"fmt"

	"github.com/bornjre/crypticnote/cmd/app"
)

func main() {
	fmt.Println("Welcome to spaceship ")
	_app := app.NewApp(
		app.WithDebug(true),
		app.WithClipBoardWatch(),
		app.WithProtectedTextSink(),
	)
	_app.Run()
}
