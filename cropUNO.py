#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Apr 30 14:47:44 2020

@author: davidlohuis
"""

import PIL
import os

def get_pics():
    img = PIL.Image.open('pics/UNO-Zeros.png')
    img = img.crop((0,0,4090,4095))
    
    
    cnt=0
    
    for i in range(7):
        for j in range(10):
            cnt += 1
            img2 = img.crop((409*j,585*i,409*j+409,585*i+585))
            img2.save(f'real-pics/Card{cnt}.png')  



os.mkdir('real-pics')
get_pics()


pics = os.listdir('real-pics')

print(pics)

