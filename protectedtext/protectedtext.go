package protectedtext

import (
	"sync"
)

var new_note_initHashContent = "8fb29448faee18b656030e8f5a8b9e9a695900f36a3b7d7ebb0d9d51e06c8569d81a55e39b481cf50546d697e7bde1715aa6badede8ddc801c739777be77f1662"

//TODO ctx and cancelation on stop
type ProtectedText struct {
	metaPassword  string
	metaUrl       string
	metaData      []string
	oldmetaHash   string
	oldmetaHashID int // some storagepolicy might not use all params
	counter       int
	in            chan string

	//netWorkError bool //TODO
	//retryChan    chan interface{}
	//networkQueue *queue

	plock *sync.Mutex

	storagePolicy func(string)
}

func NewProtectedText() *ProtectedText {
	p := &ProtectedText{
		counter:      0,
		metaPassword: "somethinghard",
		metaUrl:      "unique233",
		plock:        &sync.Mutex{},
		//networkQueue: &queue{},
		in: make(chan string),
	}
	p.storagePolicy = p.simple_storage_policy
	return p
}

func (p *ProtectedText) Start() {
	go p.start()
}

func (p *ProtectedText) start() {
	p.initial_state()

	for {
		select {
		case msg := <-p.in:
			go p.process(msg)

			//case data := <-p.retryChan:
			//	p.handle_error(data)
		}
	}
}

func (p *ProtectedText) Stop() {}

func (p *ProtectedText) GetPushChan() chan<- string {
	return p.in
}
