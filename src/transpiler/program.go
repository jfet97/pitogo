
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

func Log(log <- chan Message) {
  for {
    fmt.Println(<- log)
  }
}



func A() {

a := NewChannelMessage()
a.Channel() <- a

}
func B() {

b := NewChannelMessage()
b.Channel() <- b

}
func C(x Message) {
x.Channel() <- NewStringMessage("yo")

}
func main() {
log := make(chan Message)
go Log(log)
go func(){
          log <- NewStringMessage("yo")

        }()
go func(){
          // NonDeterministicChoice not Implemented
        }()
go func(){
          
a := NewChannelMessage()
C.Channel() <- a

        }()
}