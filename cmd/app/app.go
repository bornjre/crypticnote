package app

import (
	"github.com/bornjre/crypticnote/clipboard"
	"github.com/bornjre/crypticnote/core"
	"github.com/bornjre/crypticnote/protectedtext"
)

type App struct {
	debug  bool
	sinks  []core.Sink
	watchs []core.Watch
	in     chan string
}

type Option func(*App)

func NewApp(opts ...Option) *App {
	a := &App{
		in: make(chan string),
	}
	for _, opt := range opts {
		opt(a)
	}

	return a
}

func WithDebug(debug bool) Option {
	return func(a *App) {
		a.debug = debug
	}
}

func WithClipBoardWatch() Option {
	return func(a *App) {
		a.watchs = append(a.watchs, clipboard.NewClipBoard())
	}
}

func WithProtectedTextSink() Option {
	return func(a *App) {
		a.sinks = append(a.sinks, protectedtext.NewProtectedText())
	}
}
