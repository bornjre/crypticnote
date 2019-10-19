package app

import "fmt"

func (a *App) Run() {
	fmt.Println("Running service")

	for _, s := range a.sinks {
		//s.SetPushChan(a.out)
		s.Start()
	}

	for _, w := range a.watchs {
		w.SetPullChan(a.in)
		w.Start()
	}

	for {
		select {
		case msg := <-a.in:
			fmt.Println("<AtTheJunction>", msg)
			//a.out <- msg
			for _, s := range a.sinks {
				c := s.GetPushChan()
				c <- msg
			}
		}
	}
}
