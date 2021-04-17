from os import error
import pandas as pd
import numpy as np
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth
import time

HotStuff2015to2020OnlyPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff 2015 - 2020 Only .csv"
HotStuffExistingSpotifyPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Spotify Features Added.csv"
HotStuffMissingSpotifyPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Missing Spotify Data Added .csv"
HotStuffFinalPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Final Dataset.csv"




#(album, genres, imageurl, previewurl)
def add_missing_features(sp):
    billboardData = pd.read_csv(HotStuffFinalPath)
    print(billboardData.iloc[3, billboardData.columns.get_loc("Spotify Genre List")])
    

    spotifyFeaturesDict = dict()

    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i)
        if(i > 20800): print(i)
        trackID = billboardData.iloc[i,billboardData.columns.get_loc("Spotify Track ID")]
        if(type(trackID) != float or trackID != 0 and not np.isnan(trackID)): continue

        songID = billboardData.iloc[i,billboardData.columns.get_loc("SongID")]
        

        if(songID not in spotifyFeaturesDict.keys()):
            try:
                song = billboardData.iloc[i,billboardData.columns.get_loc("Song")]
                performer = billboardData.iloc[i,billboardData.columns.get_loc("Performer")]
                performerFirstName = performer.split(" ", 1)[0]

                trackList = sp.search(q = song + ',' + performerFirstName, type = ['track', 'artist'], limit = 10, market = 'US')['tracks']['items']
                time.sleep(1)

                #get most popular of the 10 returned results according to spotify
                #otherwise first result is not always main result- commonly you get covers, etc
                popularityList = [s['popularity'] for s in trackList]
                index = popularityList.index(max(popularityList))
                mostPopularTrack = trackList[index]
                spotifyID = mostPopularTrack['id']
                track = sp.track(spotifyID, market = 'US')
                time.sleep(1)
                previewURL = track['preview_url']
                albumImage = track['album']['images'][0]['url']
                albumName = track['album']['name']

                #get album name from song, then search for it to get album id, then use that to find genre of album
                albumID = mostPopularTrack['album']['id']
                album = sp.album(albumID)
                time.sleep(1)
                genres = album['genres']



                
                # albumFirstString = albumName.split(" ", 1)[0]
                # print(albumFirstString + " " + performerFirstName)




                # searchedAlbum = sp.search(q = albumFirstString + "," + performerFirstName, type = ['album'], limit = 1, market = 'US')['albums']['items'][0]
                # time.sleep(1)
                # albumID = searchedAlbum['id']
                # album = sp.album(albumID)
                # genres = album['genres']

                spotifyFeaturesDict[songID] = (albumName, spotifyID, genres, albumImage, previewURL)

            except:
                continue

    albumColumn = []
    spotifyIDColumn = []
    genreColumn = []
    albumImageColumn = []
    previewURLColumn = []


    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i/5200)

        trackID = billboardData.iloc[i, billboardData.columns.get_loc("Spotify Track ID")]
        songID = billboardData.iloc[i, billboardData.columns.get_loc("SongID")]

        #if the spotifyID already exists and information was already pulled
        if (type(trackID) != float or trackID != 0 and not np.isnan(trackID)):
            albumColumn.append(billboardData.iloc[i, billboardData.columns.get_loc("album")])
            spotifyIDColumn.append(billboardData.iloc[i, billboardData.columns.get_loc("Spotify Track ID")])
            genreColumn.append(billboardData.iloc[i, billboardData.columns.get_loc("Spotify Genre List")])
            albumImageColumn.append(billboardData.iloc[i, billboardData.columns.get_loc("Album Image URL")])
            previewURLColumn.append(billboardData.iloc[i, billboardData.columns.get_loc("Preview URL")])

        #else add values from dict to it 
        else:
            if(songID in spotifyFeaturesDict.keys()):
                album, spotifyID, genres, imageURL, previewURL = spotifyFeaturesDict[songID]
            else:
                album, spotifyID, genres, imageURL, previewURL = None, None, None, None, None
            
            albumColumn.append(album)
            spotifyIDColumn.append(spotifyID)
            genreColumn.append(genres)
            albumImageColumn.append(imageURL)
            previewURLColumn.append(previewURL)

    # finalGenreColumn = []
    # for genres in genreColumn:
    #     if(genres == None):
    #         finalGenreColumn.append(None)
    #         continue
    #     newGenres = []
    #     for genre in genres:
    #         newGenres.append(genre.strip(' \'\"'))
    #     finalGenreColumn.append(newGenres)
    
    billboardData.drop("album", axis = 1, inplace = True)
    billboardData.drop("Spotify Track ID", axis = 1, inplace = True)
    billboardData.drop("Spotify Genre List", axis = 1, inplace = True)
    billboardData.drop("Album Image URL", axis = 1, inplace = True)
    billboardData.drop("Preview URL", axis = 1, inplace = True)

    billboardData["album"] = albumColumn
    billboardData["Spotify Track ID"] = spotifyIDColumn
    billboardData["Spotify Genre List"] = genreColumn
    billboardData["Album Image URL"] = albumImageColumn
    billboardData["Preview URL"] = previewURLColumn

    billboardData.to_csv(HotStuffMissingSpotifyPath)





def get_spotify_features_dict(billboardData, sp):
    spotifyFeaturesDict = dict()
    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i)
        songID = billboardData.iloc[i,billboardData.columns.get_loc("SongID")]
        if(songID not in spotifyFeaturesDict.keys()):
            try:
                spotifyID = billboardData.iloc[i,billboardData.columns.get_loc("Spotify Track ID")]
                if(len(spotifyID) > 0):
                    track = sp.track(spotifyID, market = 'US')
                    previewURL = track['preview_url']
                    albumImage = track['album']['images'][0]['url']
                    spotifyFeaturesDict[songID] = (previewURL, albumImage)

            except:
                continue


    return spotifyFeaturesDict


def add_existing_album_and_playback_links(sp):
    billboardData = pd.read_csv(HotStuff2015to2020OnlyPath)
    spotifyFeaturesDict = get_spotify_features_dict(billboardData, sp)


    previewURLColumn = []
    albumImageColumn = []

    for i in range(billboardData.shape[0]):
        songID = billboardData.iloc[i,billboardData.columns.get_loc("SongID")]
        try:
            previewURL, albumImage = spotifyFeaturesDict[songID]
        except:
            previewURL, albumImage = "", ""
        
        previewURLColumn.append(previewURL)
        albumImageColumn.append(albumImage)

    billboardData.insert(billboardData.shape[1], 'Preview URL', previewURLColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'Album Image URL', albumImageColumn, allow_duplicates=True)

    billboardData.to_csv(HotStuffExistingSpotifyPath)

    return






if __name__ == "__main__":
    #auth_manager = SpotifyClientCredentials(client_id= "961c280135c44a87adc0d9a20323738d", client_secret= "c558445c25d04cf7812393625d5ee45c", requests_timeout= 10)
    #sp = spotipy.Spotify(auth_manager=auth_manager)

    genres = "["'canadian pop'", "'dance pop'", "'pop'", "'post-teen pop'"]"
    print(genres.strip(',\'\"')  )
    print()
    exit

    sp = spotipy.Spotify(auth_manager = 
    SpotifyOAuth(client_id= "961c280135c44a87adc0d9a20323738d", client_secret= "c558445c25d04cf7812393625d5ee45c", redirect_uri= "https://localhost:8080", requests_timeout= 10))
    #add_existing_album_and_playback_links(sp)
    add_missing_features(sp)
    print("fin")