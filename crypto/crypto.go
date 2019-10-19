package crypto

import "fmt"

func Encrypt(siteurl, password string, plaintext []string) (string, string) {

	ecptr := NewEncryptor(siteurl, password, plaintext)
	err := ecptr.Process()
	if err != nil {
		fmt.Println(err)
		panic("TODO")
	}
	return ecptr.ciperText, ecptr.validity_hash
}

func Decrypt(password string, cipertext string) []string {

	decrypter := NewDecryptor(password, cipertext)
	err := decrypter.Process()
	if err != nil {
		fmt.Println(err)
		panic("TODO")
	}
	return decrypter.plaintexts
}
