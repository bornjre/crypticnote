package main

import (
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/Luzifer/go-openssl"
)

/*
U2FsdGVkX18dxxiSqrx20vviRVGoS3ltOMuTjmn5tJCB37KAtXsTglA11cyIO42mCHplTkvZPU/odoaPP10b7haNJM2JSYLuyUQnRwyxbwyqGFHPaqM2C9AyVnuqOKPxuSuzwmnYan1uGTnRSKL3DLFUt0vrXk4lZWyKWckQ5LZTvu/PKjjZOFEpjBGDyStFPhn0I9Xpe7P9ed2HjDN/DOcknVOTwvKzeplVdnYBBZ0=

*/

// https://www.protectedtext.com/unique_12
var _key = "unique_12"
var sitename = "/unique_12"

var encrypted_blob_v1_no_tabs = []byte("U2FsdGVkX1+/5+NG1aqnxfiIoRHSIjBC35cZUFe3lvIPApOfY0wYPdp8GB+tjD1rycV2VlCwSmvfzXKMf1tRpx5AF2Su/34Bxe8UtJ0eY2UwwYNRrFsoy+hZoBc/VcvT4y+W31ETBjnbHGZpHWgy6GAOiGmeTWjvK2sW6/MH0ZAxHgek2/dHljgk4NDw6EZigRBOIuOXppPNTCPIxtp6Xw==")

var encrypted_blob_v2_with_tabs = []byte("U2FsdGVkX19Awib5AizWYvO2ZXAr4fkjRndvfQ1JZaSysDGTkW2rZLPaEObpVxY4nhCvP0LRs8hvCJuNoXisDhHKeU11b11mYc8UUj7usE1/Odz3MtBkYWWVu7p6WuusKhj2+1msAjwOKtufjXtZiVzUdjqEswvTARvUIeBCgPOYA9ys4CJdgfzv+sfMCGRObk+OF0jb05TdXxT/un7EI/FUDkCTrMNyrcnGWB93jsDyBbVKqgDhOnqn+W00Cek/K92y1likcXyl83yd+JBGUSj6DxjPynhXMkKEsHuEKxOCFA5+YUgGgPb4RJdGCngBd/DffuqueTvmyvm2umrH1FlWgGw/Ih7+a9ZjiHv0+AXY5mSwHF7NTl7r8Q3kPOxN/HmXgBM1umahTaSMybmmpg==")

func main() {
	fmt.Println("Welcome to spaceship")

	decrypt_and_check(encrypted_blob_v1_no_tabs, _key, sitename)
	decrypt_and_check(encrypted_blob_v2_with_tabs, _key, sitename)

	attach_and_encrypt([]string{"this is unique", "vvvvvvvvvv"}, _key, sitename)
}

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
	//buf := new(bytes.Buffer)

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
