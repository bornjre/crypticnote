package protectedtext

import "fmt"

type ProtectedText struct {
	in <-chan string
	//TODO ctx and cancelation on stop
}

func NewProtectedText() *ProtectedText {
	return &ProtectedText{}
}

func (p *ProtectedText) Start() {
	go func() {
		for {
			select {
			case msg := <-p.in:
				fmt.Println("<FinalDestination>", msg)
			}
		}
	}()
}
func (p *ProtectedText) Stop() {}
func (p *ProtectedText) SetPushChan(c <-chan string) {
	p.in = c
}
