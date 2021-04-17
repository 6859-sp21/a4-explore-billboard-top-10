import pandas as pd
import numpy as np

audioFeaturesFilePath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot 100 Audio Features.xlsx"
originalDataFilePath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff 2000-2020.csv"
audioFeaturesAddedPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Spotify Features Added.csv"
booleansAddedPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Genre Booleans Added.csv"
missingWeeksAddedPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Missing Weeks Added.csv"
testfilePath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\TestTargetFile.csv"
HotStuffExistingSpotifyPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Spotify Features Added.csv"
HotStuffMissingSpotifyPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Missing Spotify Data Added .csv"
HotStuffFinalPath = r"C:\Users\victo\Desktop\6.859\a4-explore-billboard-top-10\Hot Stuff Final Dataset.csv"

'''
Creates dictionary mapping songIDs to the song's audio features

Takes in Hot 100 Audio Features dataFrame as input
Returns dict- keys are unique songIDs, values are tuple of: (song, performer, spotifyGenreList, album, spotifyTrackID)
spotifyGenreList is type list, all else are strings
If data is missing spotify info- replace spotifyGenreList w/ empty list, album and track_id w/ empty string
'''
def create_audio_features_dict(featuresData):
    featuresDict = {}
    for i in range(featuresData.shape[0]):
        
        songID = featuresData.iloc[i, featuresData.columns.get_loc("SongID")]
        #song = featuresData.iloc[i, featuresData.columns.get_loc("Song")]
        #performer = featuresData.iloc[i, featuresData.columns.get_loc("Performer")] 
        spotifyGenreList = featuresData.iloc[i, featuresData.columns.get_loc("spotify_genre")]
        album = featuresData.iloc[i, featuresData.columns.get_loc("spotify_track_album")]
        spotifyTrackID = featuresData.iloc[i, featuresData.columns.get_loc("spotify_track_id")]

        #if spotify info for song is empty, replace w/ empty values
        if(type(spotifyGenreList) == float): 
            spotifyGenreList = []
            album = ""
            spotifyTrackID = ""
        #replace string from excel cell with list value
        else: 
            spotifyGenreList = spotifyGenreList.strip('][').split(', ')

        featuresDict[songID] = (spotifyGenreList, album, spotifyTrackID)
    
    return featuresDict

'''
Add features from Hot 100 Audio Features to rows based on songID mapping
And send dataframe to new csv
If Hot 100 Audio Features is missing the song or the spotify features,
Replace spotifyGenreList w/ empty list, album and track_id w/ empty string
'''
def add_audio_features():
    billboardData = pd.read_csv(originalDataFilePath)
    featuresData = pd.read_excel(audioFeaturesFilePath, engine = 'openpyxl')
    
    featuresDict = create_audio_features_dict(featuresData)

    spotifyGenreListColumn = []
    albumColumn = []
    spotifyTrackIDColumn = []
    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i)
        songID = billboardData.iloc[i, billboardData.columns.get_loc("SongID")]

        #if audio features file doesn't have info on a song
        try:
            spotifyGenreList, album, trackID = featuresDict[songID]
        except:
            spotifyGenreListColumn.append([])
            albumColumn.append("")
            spotifyTrackIDColumn.append("")
            continue

        spotifyGenreListColumn.append(spotifyGenreList)
        albumColumn.append(album)
        spotifyTrackIDColumn.append(trackID)
    
    billboardData.insert(billboardData.shape[1], 'Spotify Genre List', spotifyGenreListColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'album', albumColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'Spotify Track ID', spotifyTrackIDColumn, allow_duplicates=True)

    billboardData.to_csv(audioFeaturesAddedPath)

'''
Counts the most popular genres on the billboard top 100, and returns a sorted list of tuples: (genre, count)
Popular defined by how many times a song with that genre shows up on the chart
With songs showing up in n weeks counting n times
'''
def count_popular_genres():
    billboardData = pd.read_csv(audioFeaturesAddedPath)

    genreToCountDict = {}
    for i in range(billboardData.shape[0]):
        genreList = billboardData.iloc[i, billboardData.columns.get_loc("Spotify Genre List")]
        genreList = genreList.strip('][').split(',')
        for genre in genreList:
            #get string in readable format
            genre = genre.strip(' \'\"')
            if(genre in genreToCountDict.keys()):
                genreToCountDict[genre] += 1
            else:
                genreToCountDict[genre] = 1

    popularGenreList = sorted(genreToCountDict.items(), key = lambda x: x[1], reverse= True)
    return popularGenreList

'''
Add columns to csv for booleans - isPop, isRap, isCountry, isR&B, isHipHop
True if respective genre, or subgenre in Spotify Genre List
i.e. dance pop counts as pop
Note that songs with missing Spotify Genre Lists will have false for all values
'''
def add_genre_booleans():
    billboardData = pd.read_csv(HotStuffMissingSpotifyPath)

    isPopColumn = []
    isRapColumn = []
    isCountryColumn = []
    isRandBColumn = []
    isHipHopColumn = []
    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i)

        #Get genreList in working format
        genreList = billboardData.iloc[i, billboardData.columns.get_loc("Spotify Genre List")]
        if (type(genreList) == float): 
            genreList = "[]"
        genreList = genreList.strip('][').split(',')
        genreSet = set([s.strip(' \'\"') for s in genreList])
        

        isPopColumn.append('pop' in '\t'.join(genreSet))
        isRapColumn.append('rap' in '\t'.join(genreSet))
        isCountryColumn.append('country' in '\t'.join(genreSet))
        isRandBColumn.append('R&B' in '\t'.join(genreSet))
        isHipHopColumn.append('hip hop' in '\t'.join(genreSet))

    del billboardData['isPop']
    del billboardData['isRap']
    del billboardData['isCountry']
    del billboardData['isR&B']
    del billboardData['isHipPop']

    billboardData.insert(billboardData.shape[1], 'isPop', isPopColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'isRap', isRapColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'isCountry', isCountryColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'isR&B', isRandBColumn, allow_duplicates=True)
    billboardData.insert(billboardData.shape[1], 'isHipPop', isHipHopColumn, allow_duplicates=True)

    billboardData.to_csv(HotStuffFinalPath)
        

'''
Reformate the Spotify Genre List column such that the strings in each genre list does not have apostrophes
And write to csv
'''
def reformat_genres(): 
    billboardData = pd.read_csv(HotStuffFinalPath)

    genreColumn = []
    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i)

        #Get genreList in working format
        genreList = billboardData.iloc[i, billboardData.columns.get_loc("Spotify Genre List")]

        if (type(genreList) == float): 
            genreList = []
            genreColumn.append(genreList)
            continue

        genreList = genreList.strip('][').split(',')
        genreSet = set([s.strip(' \'\"') for s in genreList])
        genreColumn.append(list(genreSet))
    
    del billboardData['Spotify Genre List']
    billboardData.insert(billboardData.shape[1], 'Spotify Genre List', genreColumn, allow_duplicates=True)

    billboardData.to_csv(HotStuffFinalPath)


'''
For all weeks in 2020, calculate the weeks that each song has been on chart previously,
and update the column accordingly
'''
def add_missing_weeks_on_chart():
    billboardData = pd.read_csv(booleansAddedPath)

    weeksOnChartColumn = []
    songIDToWeeksDict = {}
    for i in range(billboardData.shape[0]):
        if(i%5200 == 0): print(i/5200)
        """ if(i == 104450): 
            print(weeksOnChartColumn[-1])
            return """

        weeksOnChart = billboardData.iloc[i, billboardData.columns.get_loc("Weeks on Chart")]
        songID = billboardData.iloc[i, billboardData.columns.get_loc("SongID")]
        #if the weeksOnChart value for that week and song already exists
        #aka if the week is before 2020
        if (weeksOnChart != 0 and not np.isnan(weeksOnChart)):
            songIDToWeeksDict[songID] = weeksOnChart
        #else either add the song to the dict to track, or keep updating it
        else:
            if(songID in songIDToWeeksDict.keys()):
                songIDToWeeksDict[songID] += 1
            else:
                songIDToWeeksDict[songID] = 1
        
        weeksOnChartColumn.append(songIDToWeeksDict[songID])
    
    billboardData.drop("Weeks on Chart", axis = 1, inplace = True)
    print(len(weeksOnChartColumn))
    print(billboardData.shape[0])
    billboardData["Weeks on Chart"] = weeksOnChartColumn

    billboardData.to_csv(missingWeeksAddedPath)






        


if __name__ == "__main__":
    #add_audio_features()
    #print(count_popular_genres()[0:15])
    #add_genre_booleans()
    #add_missing_weeks_on_chart()
    reformat_genres()
    print("fin")
