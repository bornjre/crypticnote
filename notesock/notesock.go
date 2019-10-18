package notesock

type NoteSock struct {
	out <-chan string
}

func NewNoteSock() *NoteSock {
	return &NoteSock{}
}

func (p *NoteSock) Start() {}
func (p *NoteSock) Stop()  {}
func (p *NoteSock) SetPullChan(c <-chan string) {
	p.out = c
}
