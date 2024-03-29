package utils

import "math/rand"

func RandomInt(min, max int) int {
	return rand.Intn(max-min) + min
}

// return a number between min and max
func RandomFloat64(min, max float64) float64 {
	return min + rand.Float64()*(max-min)
}
