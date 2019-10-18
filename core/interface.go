package core

type Service interface {
	Start()
	Stop()
}

type Sink interface {
	Service
	SetPushChan(<-chan string)
}

type Watch interface {
	Service
	SetPullChan(chan<- string)
}
