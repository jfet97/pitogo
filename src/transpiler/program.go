
package main

import "fmt"

type Message struct {
	value interface{}
}

func NewNumberMessage(n int) Message {
	return Message{value: n}
}

func NewStringMessage(s string) Message {
	return Message{value: s}
}

func NewChannelMessage() Message {
	ch := make(chan Message)
	return Message{value: ch}
}

func (m Message) String() string {
	switch v := m.value.(type) {
	case int:
		return fmt.Sprintf("Message<%d>", v)
	case string:
		return fmt.Sprintf("Message<\"%s\">", v)
	case chan Message:
		return "Message<channel>"
	default:
		return "Message<unknown>"
	}
}

func (m Message) Channel() (chan Message) {
	switch v := m.value.(type) {
	case chan Message:
		return v
	default:
		panic("Trying to use a non channel message as channel")
	}
}

func (m Message) Println() {
	fmt.Println(m.String())
}

// usage: fmt.Println(NewStringMessage("hello"))
// result: Message<"hello">





func A( ) {
fmt.Println(NewStringMessage("a"))

}
func B( ) {
fmt.Println(NewStringMessage("b"))

}
func C(c Message ) {
c.Channel() <- NewStringMessage("c")

}
func main() {


c := NewChannelMessage()

      // nesting to avoid name collisions, I always use the same name for the channel
      {
        dOne := make(chan struct{}, 2)
        go func(dOne chan <- struct{}){
            C(c)

          dOne <- struct{}{}  // signal completion
        }(dOne)
go func(dOne chan <- struct{}){
            
      // nesting to avoid name collisions, I always use the same name for the channel
      {
      goOn := make(chan struct{}, 100)
      for {
        go func(goOn <- chan struct{}){
            a := <- c.Channel()
fmt.Println(NewStringMessage("received"))
fmt.Println(a)
A()
          <- goOn  // signal completion the other way around
        }(goOn)

        goOn <- struct{}{}
      }
    }

      
          dOne <- struct{}{}  // signal completion
        }(dOne)
        for i := 0; i < 2; i++ {
          <- dOne
        }
  }

}