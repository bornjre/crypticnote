package crypto

import "testing"

// https://www.protectedtext.com/unique_12
var _key = "unique_12"
var sitename = "/unique_12"

var encrypted_blob_v1_no_tabs = []byte("U2FsdGVkX1+/5+NG1aqnxfiIoRHSIjBC35cZUFe3lvIPApOfY0wYPdp8GB+tjD1rycV2VlCwSmvfzXKMf1tRpx5AF2Su/34Bxe8UtJ0eY2UwwYNRrFsoy+hZoBc/VcvT4y+W31ETBjnbHGZpHWgy6GAOiGmeTWjvK2sW6/MH0ZAxHgek2/dHljgk4NDw6EZigRBOIuOXppPNTCPIxtp6Xw==")

var encrypted_blob_v2_with_tabs = []byte("U2FsdGVkX19Awib5AizWYvO2ZXAr4fkjRndvfQ1JZaSysDGTkW2rZLPaEObpVxY4nhCvP0LRs8hvCJuNoXisDhHKeU11b11mYc8UUj7usE1/Odz3MtBkYWWVu7p6WuusKhj2+1msAjwOKtufjXtZiVzUdjqEswvTARvUIeBCgPOYA9ys4CJdgfzv+sfMCGRObk+OF0jb05TdXxT/un7EI/FUDkCTrMNyrcnGWB93jsDyBbVKqgDhOnqn+W00Cek/K92y1likcXyl83yd+JBGUSj6DxjPynhXMkKEsHuEKxOCFA5+YUgGgPb4RJdGCngBd/DffuqueTvmyvm2umrH1FlWgGw/Ih7+a9ZjiHv0+AXY5mSwHF7NTl7r8Q3kPOxN/HmXgBM1umahTaSMybmmpg==")

func Test_crypto(t *testing.T) {
	// TODO write proper test

	decrypt_and_check(encrypted_blob_v1_no_tabs, _key, sitename)
	decrypt_and_check(encrypted_blob_v2_with_tabs, _key, sitename)
	attach_and_encrypt([]string{"this is unique", "vvvvvvvvvv"}, _key, sitename)
}
