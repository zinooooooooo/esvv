import React from 'react';
import { AiOutlineUser } from "react-icons/ai";
import { IoSearch } from "react-icons/io5";

const Navbar = () => {
  return (
    <nav className='bg-gray-800 px-4 py-3 flex justify-between'>
      <div className='flex items-center text-xl'>
        <span className='text-white font-semibold'>iMSWDO</span>
      </div>

      <div className='flex items-center gap-x-5'>
        <div className='relative md:w-65'>
          <span className='relative md:absolute inset-y-0 left-0 flex items-center p1-2'>
            <button className='p-1 focus:outline-none text-white md:text-black'>
              <IoSearch />
            </button>
          </span>
          <input type="text" className='w-full px-4 py-1 pl-12 rounded shadow outline-none hidden md:block' />
        </div>

        <div className='relative'>
          <button className='text-white group'>
            <AiOutlineUser className='w-6 h-6 mt-1' />
            <div className='z-10 hidden absolute bg-white rounded-lg shadow w-32 group-focus:block top-full right-0'>
              <ul className='py-2 text-sm text-gray-950'>
                <li><a href="">Profile</a></li>
                <li><a href="">Settings</a></li>
                <li><a href="">Logout</a></li>
              </ul>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
