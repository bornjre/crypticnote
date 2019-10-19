package notesock

import (
	"log"
	"net"
)

type NoteSock struct {
	out <-chan string
}

func NewNoteSock() *NoteSock {
	return &NoteSock{}
}

func (p *NoteSock) Start() {
	go p.start()
}
func (p *NoteSock) Stop() {}
func (p *NoteSock) SetPullChan(c <-chan string) {
	p.out = c
}

func (p *NoteSock) handler(c net.Conn) {
	for {
		buf := make([]byte, 512)
		nr, err := c.Read(buf)
		if err != nil {
			return
		}

		data := buf[0:nr]
		println("Server got:", string(data))
		_, err = c.Write(data)
		if err != nil {
			log.Fatal("Write: ", err)
		}
	}
}

func (p *NoteSock) start() {
	l, err := net.Listen("unix", "/tmp/cnote.sock")
	if err != nil {
		log.Fatal("listen error:", err)
	}

	for {
		fd, err := l.Accept()
		if err != nil {
			log.Fatal("accept error:", err)
		}

		go p.handler(fd)
	}
}
