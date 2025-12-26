import React from 'react'
import DropFile from './DropFile'
const HeroSec = () => {
   
    return (

        <section className='hero  bg-linear-to-r from-yellow-200 from-46%  to-cyan-200 to-53% '>
       <div className='flex justify-between w-full h-[90vh] pt-10'>
        <div className=' mt-10 w-90  flex flex-col gap-20 ml-3 '> 
            <p className='font-bold'>👉🏼 OCR (Optical Character Recognition) is
                 technology that converts images of text (from scans, photos, or PDFs) into machine-readable, editable, and searchable digital text</p>
             
            <p className='font-bold'>👉🏼 It turns physical piles of paper into searchable digital archives. You can find a specific document by typing a keyword instead of digging through boxes.</p>

            <p className='font-bold'>👉🏼 It will be usefull for students and professionals for finding reference text in digital documents , instead of just scrolling endlessly to search it . </p>
             
        </div>
        <DropFile/>
        <div className='mt-10  flex flex-col  gap-20  text-center mr-3 text-3xl font-extrabold'> 
            <h2>Technology Used</h2>
          <ul className='flex flex-col text-2xl  gap-10'>
            <li>Tesseract.JS</li>
            <li>sharp</li>
            <li>pdf-to-img</li>
            <li>pdf-lib</li>
          </ul>
        </div>
        </div>
        </section>

    )
}

export default HeroSec
