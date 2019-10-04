package crypto

import (
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/Luzifer/go-openssl"
)

func decrypt(encryptedblob []byte, key, siteurl string) ([]byte, error) {
	o := openssl.New()
	return o.DecryptBytes(key, encryptedblob, openssl.DigestMD5Sum)
}

func decrypt_and_check(encryptedblob []byte, key, siteurl string) {

	tailedtext_byte, err := decrypt(encryptedblob, key, siteurl)
	if err != nil {
		fmt.Println(err)
		return
	}

	// 128 cz sha512 is 64bit and convering byte into hexstring (8 => 16)
	// makes 64 128
	// siteurl hash is padded at the last to check correctness or sth SO
	// TODO actually check the correctness
	offset := (len(tailedtext_byte) - 128)
	text := string(tailedtext_byte[:offset])

	//fmt.Println(text)

	tabs_texts := strings.Split(text, seperator())
	fmt.Printf("%+v \n", tabs_texts)
}

func encrypt(plaintext []byte, password string) ([]byte, error) {
	o := openssl.New()
	return o.EncryptBytes(password, plaintext, openssl.DigestMD5Sum)
}

func attach_and_encrypt(plaintext []string, password string, siteurl string) ([]byte, error) {

	// should use buffer instead
	var concatinatedtext strings.Builder

	for n, pertabtext := range plaintext {

		concatinatedtext.WriteString(pertabtext)
		//buf.Write( []byte(pertabtext))

		if n == (len(plaintext) - 1) {
			concatinatedtext.WriteString(sha_me(siteurl))
		} else {
			concatinatedtext.WriteString(seperator())
		}

	}
	//fmt.Printf("%+v \n", concatinatedtext.String())
	return encrypt([]byte(concatinatedtext.String()), password)
}

func seperator() string {
	return sha_me("-- tab separator --")
}

func sha_me(text string) string {
	sha_512 := sha512.New()
	sha_512.Write([]byte(text))
	return hex.EncodeToString(sha_512.Sum(nil))
}
