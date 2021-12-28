import axios from 'axios';
import { firebaseClient } from './firebase';

export async function fetchInitial() {
  try {
    const gsUrl = await firebaseClient
      .storage()
      .ref('gamestates')
      .getDownloadURL();
    const response = await axios.get(gsUrl);
    return response.data;
  } catch (error) {
    console.error('Failed to load gamestates', error);
    return [];
  }
}

export function lint() { }
